/**
 * Transaction: Allocate / Reserve Resource
 * Atomic read-validate-conflictCheck-write with immutable event appending.
 */

import { checkIdempotency } from '../utils/idempotency.js';
import { evaluateResourceConflict } from '../utils/conflictResolution.js';

/**
 * Executes atomic allocation transaction
 * 
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} hospitalId
 * @param {object} params
 * @returns {Promise<{ success: boolean, version: number, eventId: string, preemptionNotice?: string }>}
 */
export async function executeAllocateResource(db, hospitalId, params) {
  const {
    resourceId,
    actorId,
    actorName,
    actorRole,
    patientId,
    patientName,
    allocationType = 'reserved', // 'reserved' | 'occupied' | 'in_use'
    priority = 'normal',
    reason = '',
    idempotencyKey,
    aiSuggestedPriority = null
  } = params;

  const resourceRef = db.collection('hospitals').doc(hospitalId).collection('resources').doc(resourceId);
  const eventsRef = db.collection('hospitals').doc(hospitalId).collection('events');

  return await db.runTransaction(async (t) => {
    // 1. Check idempotency
    const { isDuplicate, existingEvent } = await checkIdempotency(t, eventsRef, idempotencyKey);
    if (isDuplicate) {
      return {
        success: true,
        isIdempotentReplay: true,
        version: existingEvent.resultingVersion,
        eventId: existingEvent.id,
        message: 'Request already processed (idempotent replay).'
      };
    }

    // 2. Read current resource state & version
    const resourceDoc = await t.get(resourceRef);
    if (!resourceDoc.exists) {
      throw new Error(`Resource with ID ${resourceId} does not exist in hospital ${hospitalId}`);
    }

    const currentResource = resourceDoc.data();
    const currentVersion = currentResource.version || 1;

    // 3. Evaluate Conflict & Priority
    const conflictResult = evaluateResourceConflict(currentResource, { priority, reason });
    
    if (!conflictResult.canProceed) {
      // Log rejected conflict event atomically to provide auditability
      const rejectEventId = `evt-reject-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const rejectEventRef = eventsRef.doc(rejectEventId);
      
      t.set(rejectEventRef, {
        id: rejectEventId,
        type: 'conflict_rejected',
        resourceId,
        actorId,
        actorName: actorName || 'Unknown Doctor',
        actorRole: actorRole || 'doctor',
        timestamp: new Date(),
        idempotencyKey: idempotencyKey || `reject-${Date.now()}`,
        resultingVersion: currentVersion,
        payload: {
          requestedStatus: allocationType,
          requestedPriority: priority,
          aiSuggestedPriority,
          patientId,
          patientName,
          rejectionReason: conflictResult.reason,
          currentState: {
            status: currentResource.status,
            heldBy: currentResource.currentAllocation?.patientName || 'Unknown',
            existingPriority: currentResource.currentAllocation?.priority || 'normal'
          }
        }
      });

      const err = new Error(conflictResult.reason);
      err.code = 'RESOURCE_CONFLICT';
      err.conflictDetails = {
        resourceId,
        currentStatus: currentResource.status,
        reason: conflictResult.reason
      };
      throw err;
    }

    // 4. Handle preemption if higher priority override occurred
    let preemptionEventId = null;
    if (conflictResult.isPreemption && conflictResult.preemptedAllocation) {
      preemptionEventId = `evt-preempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const preemptEventRef = eventsRef.doc(preemptionEventId);
      t.set(preemptEventRef, {
        id: preemptionEventId,
        type: 'escalation_preemption',
        resourceId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date(),
        idempotencyKey: `preempt-${Date.now()}`,
        resultingVersion: currentVersion,
        payload: {
          preemptedPatientId: conflictResult.preemptedAllocation.patientId,
          preemptedPatientName: conflictResult.preemptedAllocation.patientName,
          overridingPatientId: patientId,
          overridingPatientName: patientName,
          overridePriority: priority,
          reason: conflictResult.reason
        }
      });
    }

    // 5. Compute new state & increment version
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

    // 6. Write resource state
    t.set(resourceRef, {
      ...currentResource,
      status: allocationType,
      version: newVersion,
      currentAllocation: newAllocation,
      updatedAt: new Date()
    });

    // 7. Append immutable success event
    const eventId = `evt-alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = eventsRef.doc(eventId);
    
    t.set(eventRef, {
      id: eventId,
      type: allocationType === 'reserved' ? 'reserve' : 'allocate',
      resourceId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date(),
      idempotencyKey: idempotencyKey || `alloc-${Date.now()}`,
      resultingVersion: newVersion,
      payload: {
        newStatus: allocationType,
        priority,
        aiSuggestedPriority,
        patientId,
        patientName,
        reason,
        previousVersion: currentVersion,
        wasPreemption: conflictResult.isPreemption
      }
    });

    return {
      success: true,
      version: newVersion,
      eventId,
      preemptionNotice: conflictResult.isPreemption ? conflictResult.reason : null
    };
  });
}
