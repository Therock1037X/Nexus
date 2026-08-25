/**
 * Transaction: Transfer Patient Between Resources
 * Atomically reallocates target resource, releases source resource, updates patient bed ID, and logs transfer audit event.
 */

import { checkIdempotency } from '../utils/idempotency.js';
import { evaluateResourceConflict } from '../utils/conflictResolution.js';

export async function executeTransferResource(db, hospitalId, params) {
  const {
    sourceResourceId,
    targetResourceId,
    patientId,
    patientName,
    actorId,
    actorName,
    actorRole,
    priority = 'urgent',
    transferReason = 'Clinical transfer',
    idempotencyKey
  } = params;

  const sourceRef = db.collection('hospitals').doc(hospitalId).collection('resources').doc(sourceResourceId);
  const targetRef = db.collection('hospitals').doc(hospitalId).collection('resources').doc(targetResourceId);
  const patientRef = db.collection('hospitals').doc(hospitalId).collection('patients').doc(patientId);
  const eventsRef = db.collection('hospitals').doc(hospitalId).collection('events');

  return await db.runTransaction(async (t) => {
    // 1. Check idempotency
    const { isDuplicate, existingEvent } = await checkIdempotency(t, eventsRef, idempotencyKey);
    if (isDuplicate) {
      return {
        success: true,
        isIdempotentReplay: true,
        version: existingEvent.resultingVersion,
        eventId: existingEvent.id
      };
    }

    // 2. Read Source & Target Resources
    const sourceDoc = await t.get(sourceRef);
    const targetDoc = await t.get(targetRef);

    if (!sourceDoc.exists) {
      throw new Error(`Source resource ${sourceResourceId} does not exist.`);
    }
    if (!targetDoc.exists) {
      throw new Error(`Target resource ${targetResourceId} does not exist.`);
    }

    const sourceData = sourceDoc.data();
    const targetData = targetDoc.data();

    // 3. Evaluate Target Conflict
    const conflictResult = evaluateResourceConflict(targetData, { priority, reason: transferReason });
    if (!conflictResult.canProceed) {
      throw new Error(`Transfer rejected: ${conflictResult.reason}`);
    }

    // 4. Compute new versions
    const newSourceVersion = (sourceData.version || 1) + 1;
    const newTargetVersion = (targetData.version || 1) + 1;

    // 5. Update Source Resource (mark for cleaning or free)
    t.set(sourceRef, {
      ...sourceData,
      status: 'cleaning',
      version: newSourceVersion,
      currentAllocation: null,
      updatedAt: new Date()
    });

    // 6. Update Target Resource (occupy)
    const targetAllocation = {
      patientId,
      patientName: patientName || sourceData.currentAllocation?.patientName || 'Transferred Patient',
      assignedDoctorId: actorId,
      assignedDoctorName: actorName,
      priority,
      reason: transferReason,
      allocatedAt: new Date().toISOString()
    };

    t.set(targetRef, {
      ...targetData,
      status: 'occupied',
      version: newTargetVersion,
      currentAllocation: targetAllocation,
      updatedAt: new Date()
    });

    // 7. Update Patient currentBedId
    t.set(patientRef, {
      currentBedId: targetResourceId,
      lastTransferAt: new Date().toISOString()
    }, { merge: true });

    // 8. Append Transfer Event
    const eventId = `evt-trans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = eventsRef.doc(eventId);
    
    t.set(eventRef, {
      id: eventId,
      type: 'transfer',
      resourceId: targetResourceId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date(),
      idempotencyKey: idempotencyKey || `trans-${Date.now()}`,
      resultingVersion: newTargetVersion,
      payload: {
        sourceResourceId,
        targetResourceId,
        patientId,
        patientName: targetAllocation.patientName,
        reason: transferReason,
        priority
      }
    });

    return {
      success: true,
      sourceVersion: newSourceVersion,
      targetVersion: newTargetVersion,
      eventId
    };
  });
}
