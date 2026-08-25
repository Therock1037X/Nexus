/**
 * Prescription Saga Coordinator (3-Step Clinical Saga)
 * Step 1: Doctor Prescribes -> Stock verification & reservation
 * Step 2: Pharmacy Dispenses -> Pharmacist packaging & dispatch
 * Step 3: Nurse Administers -> Bedside patient administration & vitals check
 * 
 * Compensating Action (Rollback):
 * If rejected by pharmacy or cancelled by nurse (e.g. adverse reaction, allergy),
 * the allocated medicine stock is atomically refunded to inventory, version incremented,
 * and compensation audit log appended.
 */

export async function startPrescriptionSaga(db, hospitalId, params) {
  const {
    patientId,
    patientName,
    medicineId,
    medicineName,
    dosage,
    quantity = 1,
    doctorId,
    doctorName,
    notes = '',
    idempotencyKey
  } = params;

  const medicineRef = db.collection('hospitals').doc(hospitalId).collection('resources').doc(medicineId);
  const sagasRef = db.collection('hospitals').doc(hospitalId).collection('sagas');
  const eventsRef = db.collection('hospitals').doc(hospitalId).collection('events');

  return await db.runTransaction(async (t) => {
    // 1. Read Medicine Stock
    const medDoc = await t.get(medicineRef);
    if (!medDoc.exists) {
      throw new Error(`Medicine ${medicineName || medicineId} not found in inventory.`);
    }

    const medData = medDoc.data();
    const currentStock = Number(medData.quantity) || 0;
    const requiredQty = Number(quantity);

    if (currentStock < requiredQty) {
      const error = new Error(`Insufficient stock for ${medData.name}. Available: ${currentStock}, Requested: ${requiredQty}`);
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }

    // 2. Decrement medicine stock atomically & increment version
    const newStock = currentStock - requiredQty;
    const newMedVersion = (medData.version || 1) + 1;

    t.set(medicineRef, {
      ...medData,
      quantity: newStock,
      version: newMedVersion,
      updatedAt: new Date()
    });

    // 3. Create Saga Document
    const sagaId = `saga-rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sagaDocRef = sagasRef.doc(sagaId);

    const initialSteps = [
      {
        stepName: 'order',
        label: 'Doctor Prescription Order',
        status: 'done',
        timestamp: new Date().toISOString(),
        actorId: doctorId,
        actorName: doctorName,
        actorRole: 'doctor',
        details: `Prescribed ${quantity}x ${medicineName || medData.name} (${dosage})`
      },
      {
        stepName: 'dispense',
        label: 'Pharmacy Stock Dispense',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'pharmacy',
        details: 'Awaiting pharmacy verification and fulfillment'
      },
      {
        stepName: 'administer',
        label: 'Bedside Nurse Administration',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'nurse',
        details: 'Awaiting bedside administration to patient'
      }
    ];

    t.set(sagaDocRef, {
      id: sagaId,
      type: 'prescription',
      hospitalId,
      patientId,
      patientName,
      medicineId,
      medicineName: medicineName || medData.name,
      dosage,
      quantity: requiredQty,
      status: 'in_progress',
      notes,
      steps: initialSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 4. Append Audit Event
    const eventId = `evt-saga-order-${Date.now()}`;
    const eventRef = eventsRef.doc(eventId);
    t.set(eventRef, {
      id: eventId,
      type: 'clinical_event',
      resourceId: medicineId,
      actorId: doctorId,
      actorName: doctorName,
      actorRole: 'doctor',
      timestamp: new Date(),
      idempotencyKey: idempotencyKey || `saga-order-${Date.now()}`,
      resultingVersion: newMedVersion,
      payload: {
        sagaId,
        action: 'PRESCRIPTION_ORDERED',
        patientId,
        patientName,
        medicineName: medicineName || medData.name,
        quantityDeducted: requiredQty,
        remainingStock: newStock
      }
    });

    return {
      success: true,
      sagaId,
      remainingStock: newStock,
      version: newMedVersion
    };
  });
}

export async function advancePrescriptionSaga(db, hospitalId, params) {
  const {
    sagaId,
    stepName, // 'dispense' | 'administer'
    actorId,
    actorName,
    actorRole,
    details = '',
    clinicalVitals = null
  } = params;

  const sagaRef = db.collection('hospitals').doc(hospitalId).collection('sagas').doc(sagaId);
  const eventsRef = db.collection('hospitals').doc(hospitalId).collection('events');

  return await db.runTransaction(async (t) => {
    const sagaDoc = await t.get(sagaRef);
    if (!sagaDoc.exists) {
      throw new Error(`Saga ${sagaId} does not exist.`);
    }

    const saga = sagaDoc.data();
    if (saga.status !== 'in_progress') {
      throw new Error(`Cannot advance saga in ${saga.status} status.`);
    }

    const updatedSteps = saga.steps.map((step) => {
      if (step.stepName === stepName) {
        return {
          ...step,
          status: 'done',
          timestamp: new Date().toISOString(),
          actorId,
          actorName,
          actorRole,
          details: details || step.details,
          clinicalVitals: clinicalVitals || null
        };
      }
      return step;
    });

    const isAllDone = updatedSteps.every((s) => s.status === 'done');
    const newSagaStatus = isAllDone ? 'completed' : 'in_progress';

    t.set(sagaRef, {
      ...saga,
      steps: updatedSteps,
      status: newSagaStatus,
      updatedAt: new Date().toISOString()
    });

    // Append Audit Event
    const eventId = `evt-saga-${stepName}-${Date.now()}`;
    t.set(eventsRef.doc(eventId), {
      id: eventId,
      type: 'clinical_event',
      resourceId: saga.medicineId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date(),
      resultingVersion: 1,
      payload: {
        sagaId,
        stepName,
        patientId: saga.patientId,
        patientName: saga.patientName,
        isCompleted: isAllDone,
        clinicalVitals
      }
    });

    return {
      success: true,
      sagaId,
      status: newSagaStatus,
      completed: isAllDone
    };
  });
}

export async function compensatePrescriptionSaga(db, hospitalId, params) {
  const {
    sagaId,
    actorId,
    actorName,
    actorRole,
    reason = 'Patient contraindication or order cancelled'
  } = params;

  const sagaRef = db.collection('hospitals').doc(hospitalId).collection('sagas').doc(sagaId);
  const eventsRef = db.collection('hospitals').doc(hospitalId).collection('events');

  return await db.runTransaction(async (t) => {
    const sagaDoc = await t.get(sagaRef);
    if (!sagaDoc.exists) {
      throw new Error(`Saga ${sagaId} not found.`);
    }

    const saga = sagaDoc.data();
    if (saga.status === 'compensated') {
      return { success: true, alreadyCompensated: true };
    }

    const medicineRef = db.collection('hospitals').doc(hospitalId).collection('resources').doc(saga.medicineId);
    const medDoc = await t.get(medicineRef);

    let newStock = null;
    let newMedVersion = 1;

    // Refund medicine inventory
    if (medDoc.exists) {
      const medData = medDoc.data();
      const currentStock = Number(medData.quantity) || 0;
      const restoreQty = Number(saga.quantity) || 1;
      newStock = currentStock + restoreQty;
      newMedVersion = (medData.version || 1) + 1;

      t.set(medicineRef, {
        ...medData,
        quantity: newStock,
        version: newMedVersion,
        updatedAt: new Date()
      });
    }

    // Mark steps as compensated
    const compensatedSteps = saga.steps.map((step) => {
      if (step.status === 'done' || step.status === 'pending') {
        return {
          ...step,
          status: step.status === 'done' ? 'compensated' : 'cancelled',
          compensatedAt: new Date().toISOString(),
          compensationReason: reason
        };
      }
      return step;
    });

    t.set(sagaRef, {
      ...saga,
      steps: compensatedSteps,
      status: 'compensated',
      compensationDetails: {
        actorId,
        actorName,
        actorRole,
        reason,
        compensatedAt: new Date().toISOString(),
        stockRefunded: saga.quantity,
        newStockLevel: newStock
      },
      updatedAt: new Date().toISOString()
    });

    // Append compensation audit event
    const eventId = `evt-compensate-${Date.now()}`;
    t.set(eventsRef.doc(eventId), {
      id: eventId,
      type: 'saga_compensate',
      resourceId: saga.medicineId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date(),
      resultingVersion: newMedVersion,
      payload: {
        sagaId,
        action: 'SAGA_COMPENSATION_ROLLBACK',
        patientId: saga.patientId,
        patientName: saga.patientName,
        medicineName: saga.medicineName,
        stockRefunded: saga.quantity,
        newStockLevel: newStock,
        reason
      }
    });

    return {
      success: true,
      sagaId,
      status: 'compensated',
      stockRestored: saga.quantity,
      newStock
    };
  });
}
