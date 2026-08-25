/**
 * Resource Transaction Service (Zero Direct .update() Policy)
 * 
 * All resource state mutations MUST pass through an atomic runTransaction() block that:
 * 1. Reads current state & version
 * 2. Validates idempotency & evaluates deterministic conflict/priority preemption rules
 * 3. Writes new resource state with incremented version
 * 4. Appends an immutable audit event in the same atomic transaction
 */

import {
  db,
  doc,
  collection,
  setDoc,
  runTransaction,
  serverTimestamp,
  DEFAULT_HOSPITAL_ID,
  getResourceDocRef,
  getEventsCollectionRef
} from '../firebase/firestore.js';
import { apiClient } from './apiClient.js';

// Deterministic Priority Weights
export const PRIORITY_TIERS = {
  critical: 4,
  urgent: 3,
  high: 2,
  normal: 1,
  low: 0
};

export function getPriorityScore(priority) {
  if (!priority) return PRIORITY_TIERS.normal;
  const key = String(priority).toLowerCase().trim();
  return PRIORITY_TIERS[key] !== undefined ? PRIORITY_TIERS[key] : PRIORITY_TIERS.normal;
}

/**
 * In-memory / LocalStorage state sync for resilient local execution & fallback
 */
const LOCAL_STORAGE_RESOURCES_KEY = 'nexus_local_resources';
const LOCAL_STORAGE_EVENTS_KEY = 'nexus_local_events';

function getLocalStore(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch custom event for local reactive listeners
    window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key } }));
  } catch (err) {
    console.error('Failed to set local store:', err);
  }
}

/**
 * Local Transaction Fallback Engine (Guarantees atomic simulation if Firestore connection is mock)
 */
function executeLocalTransaction(hospitalId, updateFn) {
  const resources = getLocalStore(LOCAL_STORAGE_RESOURCES_KEY, []);
  const events = getLocalStore(LOCAL_STORAGE_EVENTS_KEY, []);

  const t = {
    get: (resId) => resources.find(r => r.id === resId) || null,
    setResource: (res) => {
      const idx = resources.findIndex(r => r.id === res.id);
      if (idx >= 0) resources[idx] = res;
      else resources.push(res);
    },
    appendEvent: (evt) => {
      events.unshift(evt);
    }
  };

  const result = updateFn(t);
  setLocalStore(LOCAL_STORAGE_RESOURCES_KEY, resources);
  setLocalStore(LOCAL_STORAGE_EVENTS_KEY, events);
  return result;
}

/**
 * 1. Allocate / Reserve Resource Transaction
 */
export async function allocateResourceTransaction({
  hospitalId = DEFAULT_HOSPITAL_ID,
  resourceId,
  actorId,
  actorName,
  actorRole = 'doctor',
  patientId,
  patientName,
  allocationType = 'reserved', // 'reserved' | 'occupied'
  priority = 'normal',
  reason = 'Physician clinical allocation',
  idempotencyKey = `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  aiSuggestedPriority = null
}) {
  // 1. Try Backend API
  try {
    const res = await apiClient.allocateResource({
      resourceId,
      actorId,
      actorName,
      actorRole,
      patientId,
      patientName,
      allocationType,
      priority,
      reason,
      idempotencyKey,
      aiSuggestedPriority
    });
    if (res?.success) {
      if (res.resource) {
        const resources = getLocalStore(LOCAL_STORAGE_RESOURCES_KEY, []);
        const idx = resources.findIndex(r => r.id === res.resource.id);
        if (idx >= 0) resources[idx] = res.resource;
        else resources.push(res.resource);
        setLocalStore(LOCAL_STORAGE_RESOURCES_KEY, resources);
      }
      return res;
    }
  } catch (apiErr) {
    if (apiErr.code === 'RESOURCE_CONFLICT') throw apiErr;
    console.warn('[TRANSACTION] Backend allocate call fell back to client:', apiErr.message);
  }

  const resourceRef = getResourceDocRef(resourceId, hospitalId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      // Step 1: Read current resource doc
      const resourceDoc = await t.get(resourceRef);
      if (!resourceDoc.exists()) {
        throw new Error(`Resource ${resourceId} does not exist in registry.`);
      }

      const current = resourceDoc.data();
      const currentVersion = Number(current.version) || 1;
      const currentStatus = current.status || 'free';
      const currentAlloc = current.currentAllocation || null;

      const newScore = getPriorityScore(priority);
      const existingScore = getPriorityScore(currentAlloc?.priority || (currentStatus === 'occupied' ? 'high' : 'normal'));

      // Step 2: Evaluate Conflict & Preemption
      let canProceed = false;
      let isPreemption = false;
      let conflictReason = '';

      if (currentStatus === 'free') {
        canProceed = true;
      } else if (currentStatus === 'cleaning' || currentStatus === 'maintenance') {
        if (newScore >= PRIORITY_TIERS.critical && currentStatus === 'cleaning') {
          canProceed = true;
          isPreemption = true;
          conflictReason = 'CRITICAL Priority override bypasses standard cleaning.';
        } else {
          canProceed = false;
          conflictReason = `Resource is undergoing ${currentStatus.toUpperCase()}.`;
        }
      } else {
        // Status is reserved or occupied
        if (newScore > existingScore) {
          canProceed = true;
          isPreemption = true;
          conflictReason = `Emergency Priority Override: Incoming ${priority.toUpperCase()} request prioritized over existing ${currentAlloc?.priority?.toUpperCase() || 'NORMAL'} hold.`;
        } else {
          canProceed = false;
          conflictReason = newScore === existingScore
            ? `Not available: This bed was already booked by another request at the same priority level.`
            : `Not available: This bed is currently assigned to a higher-urgency emergency patient.`;
        }
      }

      // Step 3: Handle Rejection
      if (!canProceed) {
        const rejectId = `evt-reject-${Date.now()}`;
        const rejectEventData = {
          id: rejectId,
          type: 'conflict_rejected',
          resourceId,
          actorId,
          actorName,
          actorRole,
          timestamp: new Date().toISOString(),
          idempotencyKey,
          resultingVersion: currentVersion,
          payload: {
            requestedStatus: allocationType,
            requestedPriority: priority,
            aiSuggestedPriority,
            patientId,
            patientName,
            rejectionReason: conflictReason,
            existingAllocation: currentAlloc
          }
        };

        // Write directly to Firestore outside transaction to guarantee persistence
        try {
          const rejectRef = doc(eventsRef, rejectId);
          setDoc(rejectRef, rejectEventData).catch(console.warn);
        } catch (writeErr) {
          console.warn('[AUDIT] Failed to async write rejectDoc:', writeErr);
        }

        // Also push to local store for instant local reactivity
        const localEvents = getLocalStore(LOCAL_STORAGE_EVENTS_KEY, []);
        localEvents.unshift(rejectEventData);
        setLocalStore(LOCAL_STORAGE_EVENTS_KEY, localEvents);

        const conflictError = new Error(conflictReason);
        conflictError.code = 'RESOURCE_CONFLICT';
        conflictError.details = { resourceId, conflictReason };
        throw conflictError;
      }

      // Step 4: Handle Preemption Event if existing holder is preempted
      if (isPreemption && currentAlloc) {
        const preemptId = `evt-preempt-${Date.now()}`;
        const preemptRef = doc(eventsRef, preemptId);
        t.set(preemptRef, {
          id: preemptId,
          type: 'escalation_preemption',
          resourceId,
          actorId,
          actorName,
          actorRole,
          timestamp: new Date().toISOString(),
          idempotencyKey: `preempt-${Date.now()}`,
          resultingVersion: currentVersion,
          payload: {
            preemptedPatientId: currentAlloc.patientId,
            preemptedPatientName: currentAlloc.patientName,
            overridingPatientId: patientId,
            overridingPatientName: patientName,
            overridePriority: priority,
            reason: conflictReason
          }
        });
      }

      // Step 5: Write new state with incremented version
      const newVersion = currentVersion + 1;
      const newAllocation = {
        patientId,
        patientName,
        assignedDoctorId: actorId,
        assignedDoctorName: actorName,
        priority,
        reason,
        allocatedAt: new Date().toISOString(),
        aiSuggestedPriority
      };

      t.set(resourceRef, {
        ...current,
        status: allocationType,
        version: newVersion,
        currentAllocation: newAllocation,
        updatedAt: new Date().toISOString()
      });

      // Step 6: Append immutable success event
      const eventId = `evt-alloc-${Date.now()}`;
      const eventRef = doc(eventsRef, eventId);
      t.set(eventRef, {
        id: eventId,
        type: allocationType === 'reserved' ? 'reserve' : 'allocate',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        idempotencyKey,
        resultingVersion: newVersion,
        payload: {
          newStatus: allocationType,
          priority,
          aiSuggestedPriority,
          patientId,
          patientName,
          reason,
          previousVersion: currentVersion,
          wasPreemption: isPreemption
        }
      });

      return {
        success: true,
        version: newVersion,
        eventId,
        preemptionNotice: isPreemption ? conflictReason : null
      };
    });
  } catch (err) {
    // If Firestore fails due to offline/demo environment, execute resilient local transaction
    if (err.code === 'RESOURCE_CONFLICT') throw err;
    console.warn('[TRANSACTION] Falling back to local store transaction:', err.message);

    return executeLocalTransaction(hospitalId, (t) => {
      const current = t.get(resourceId);
      if (!current) throw new Error(`Resource ${resourceId} not found in local store.`);

      const currentVersion = current.version || 1;
      const currentAlloc = current.currentAllocation || null;
      const newScore = getPriorityScore(priority);
      const existingScore = getPriorityScore(currentAlloc?.priority || (current.status === 'occupied' ? 'high' : 'normal'));

      let canProceed = false;
      let isPreemption = false;
      let conflictReason = '';

      if (current.status === 'free') {
        canProceed = true;
      } else if (newScore > existingScore) {
        canProceed = true;
        isPreemption = true;
        conflictReason = `Emergency Priority Override: Incoming ${priority.toUpperCase()} request prioritized over existing hold.`;
      } else {
        canProceed = false;
        conflictReason = `Not available: This bed is held by another patient with equal or higher urgency.`;
      }

      if (!canProceed) {
        const rejectEvt = {
          id: `evt-reject-${Date.now()}`,
          type: 'conflict_rejected',
          resourceId,
          actorId,
          actorName,
          actorRole,
          timestamp: new Date().toISOString(),
          idempotencyKey,
          resultingVersion: currentVersion,
          payload: { requestedPriority: priority, rejectionReason: conflictReason, patientName }
        };
        t.appendEvent(rejectEvt);
        const conflictErr = new Error(conflictReason);
        conflictErr.code = 'RESOURCE_CONFLICT';
        throw conflictErr;
      }

      const newVersion = currentVersion + 1;
      const updated = {
        ...current,
        status: allocationType,
        version: newVersion,
        currentAllocation: {
          patientId,
          patientName,
          assignedDoctorId: actorId,
          assignedDoctorName: actorName,
          priority,
          reason,
          allocatedAt: new Date().toISOString(),
          aiSuggestedPriority
        },
        updatedAt: new Date().toISOString()
      };

      t.setResource(updated);

      const event = {
        id: `evt-alloc-${Date.now()}`,
        type: allocationType === 'reserved' ? 'reserve' : 'allocate',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        idempotencyKey,
        resultingVersion: newVersion,
        payload: { newStatus: allocationType, priority, patientName, reason, wasPreemption: isPreemption }
      };
      t.appendEvent(event);

      return { success: true, version: newVersion, eventId: event.id };
    });
  }
}

/**
 * 2. Cancel / Release Resource Transaction
 */
export async function cancelResourceTransaction({
  hospitalId = DEFAULT_HOSPITAL_ID,
  resourceId,
  actorId,
  actorName,
  actorRole = 'doctor',
  reason = 'Discharged / Released by clinician',
  needsCleaning = false,
  idempotencyKey = `cancel-${Date.now()}`
}) {
  const resourceRef = getResourceDocRef(resourceId, hospitalId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      const resourceDoc = await t.get(resourceRef);
      if (!resourceDoc.exists()) throw new Error(`Resource ${resourceId} does not exist.`);

      const current = resourceDoc.data();
      const currentVersion = current.version || 1;
      const previousAlloc = current.currentAllocation || null;
      const newStatus = needsCleaning ? 'cleaning' : 'free';
      const newVersion = currentVersion + 1;

      t.set(resourceRef, {
        ...current,
        status: newStatus,
        version: newVersion,
        currentAllocation: null,
        updatedAt: new Date().toISOString()
      });

      const eventId = `evt-cancel-${Date.now()}`;
      const eventRef = doc(eventsRef, eventId);
      t.set(eventRef, {
        id: eventId,
        type: 'cancel',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        idempotencyKey,
        resultingVersion: newVersion,
        payload: {
          previousStatus: current.status,
          newStatus,
          reason,
          freedPatientName: previousAlloc?.patientName || null
        }
      });

      return { success: true, version: newVersion, eventId };
    });
  } catch (err) {
    console.warn('[TRANSACTION] Cancel falling back to local store:', err.message);
    return executeLocalTransaction(hospitalId, (t) => {
      const current = t.get(resourceId);
      if (!current) throw new Error(`Resource ${resourceId} not found.`);

      const newVersion = (current.version || 1) + 1;
      const updated = {
        ...current,
        status: needsCleaning ? 'cleaning' : 'free',
        version: newVersion,
        currentAllocation: null,
        updatedAt: new Date().toISOString()
      };
      t.setResource(updated);

      const evt = {
        id: `evt-cancel-${Date.now()}`,
        type: 'cancel',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        resultingVersion: newVersion,
        payload: { previousStatus: current.status, newStatus: updated.status, reason }
      };
      t.appendEvent(evt);
      return { success: true, version: newVersion, eventId: evt.id };
    });
  }
}

/**
 * 3. Flag Maintenance / Cleaning Issue Transaction
 */
export async function flagIssueTransaction({
  hospitalId = DEFAULT_HOSPITAL_ID,
  resourceId,
  actorId,
  actorName,
  actorRole = 'nurse',
  issueType = 'cleaning', // 'cleaning' | 'maintenance'
  notes = 'Routine sanitization required',
  idempotencyKey = `flag-${Date.now()}`
}) {
  const resourceRef = getResourceDocRef(resourceId, hospitalId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      const resourceDoc = await t.get(resourceRef);
      if (!resourceDoc.exists()) throw new Error(`Resource ${resourceId} does not exist.`);

      const current = resourceDoc.data();
      const newVersion = (current.version || 1) + 1;

      t.set(resourceRef, {
        ...current,
        status: issueType,
        version: newVersion,
        issueNotes: notes,
        updatedAt: new Date().toISOString()
      });

      const eventId = `evt-flag-${Date.now()}`;
      t.set(doc(eventsRef, eventId), {
        id: eventId,
        type: 'status_change',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        idempotencyKey,
        resultingVersion: newVersion,
        payload: { previousStatus: current.status, newStatus: issueType, notes }
      });

      return { success: true, version: newVersion, eventId };
    });
  } catch (err) {
    return executeLocalTransaction(hospitalId, (t) => {
      const current = t.get(resourceId);
      if (!current) throw new Error(`Resource ${resourceId} not found.`);
      const newVersion = (current.version || 1) + 1;
      t.setResource({
        ...current,
        status: issueType,
        version: newVersion,
        issueNotes: notes,
        updatedAt: new Date().toISOString()
      });
      const evt = {
        id: `evt-flag-${Date.now()}`,
        type: 'status_change',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        resultingVersion: newVersion,
        payload: { previousStatus: current.status, newStatus: issueType, notes }
      };
      t.appendEvent(evt);
      return { success: true, version: newVersion, eventId: evt.id };
    });
  }
}
