/**
 * Transaction: Cancel / Release Resource
 * Safely frees or resets a resource, increments version, and logs an immutable audit event.
 */

import { checkIdempotency } from '../utils/idempotency.js';

export async function executeCancelResource(db, hospitalId, params) {
  const {
    resourceId,
    actorId,
    actorName,
    actorRole,
    reason = 'Patient discharged or reservation released',
    idempotencyKey,
    needsCleaning = false
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
        eventId: existingEvent.id
      };
    }

    // 2. Read resource
    const resourceDoc = await t.get(resourceRef);
    if (!resourceDoc.exists) {
      throw new Error(`Resource ${resourceId} does not exist.`);
    }

    const currentResource = resourceDoc.data();
    const currentVersion = currentResource.version || 1;
    const previousAllocation = currentResource.currentAllocation || null;
    const newStatus = needsCleaning ? 'cleaning' : 'free';
    const newVersion = currentVersion + 1;

    // 3. Update resource state
    t.set(resourceRef, {
      ...currentResource,
      status: newStatus,
      version: newVersion,
      currentAllocation: null,
      updatedAt: new Date()
    });

    // 4. Append audit event
    const eventId = `evt-cancel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = eventsRef.doc(eventId);
    
    t.set(eventRef, {
      id: eventId,
      type: 'cancel',
      resourceId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date(),
      idempotencyKey: idempotencyKey || `cancel-${Date.now()}`,
      resultingVersion: newVersion,
      payload: {
        previousStatus: currentResource.status,
        newStatus,
        reason,
        freedPatientId: previousAllocation?.patientId || null,
        freedPatientName: previousAllocation?.patientName || null
      }
    });

    return {
      success: true,
      version: newVersion,
      eventId
    };
  });
}
