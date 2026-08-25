/**
 * Saga Service: Coordinates Multi-Step Clinical Sagas & Automated Compensation Rollbacks
 * 
 * Prescription Saga:
 * Step 1: Doctor Orders (medicine stock reserved/deducted)
 * Step 2: Pharmacy Dispenses
 * Step 3: Nurse Administers
 * 
 * If a step is rejected or aborted, the compensating action is triggered:
 * - Medicine stock is restored via atomic transaction
 * - Saga status is marked "compensated"
 * - Audit event "saga_compensate" is logged
 */

import {
  db,
  doc,
  collection,
  runTransaction,
  DEFAULT_HOSPITAL_ID,
  getResourceDocRef,
  getSagasCollectionRef,
  getEventsCollectionRef
} from '../firebase/firestore.js';
import { apiClient } from './apiClient.js';

const LOCAL_SAGAS_KEY = 'nexus_local_sagas';
const LOCAL_RESOURCES_KEY = 'nexus_local_resources';
const LOCAL_EVENTS_KEY = 'nexus_local_events';

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
    window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key } }));
  } catch (err) {
    console.error('Local store write error:', err);
  }
}

/**
 * 1. Start Prescription Saga (Step 1: Doctor Prescribes)
 */
export async function startPrescriptionSaga({
  hospitalId = DEFAULT_HOSPITAL_ID,
  patientId,
  patientName,
  medicineId,
  medicineName,
  dosage,
  quantity = 1,
  doctorId,
  doctorName,
  notes = '',
  idempotencyKey = `saga-rx-${Date.now()}`
}) {
  // 1. Try Backend API
  try {
    const res = await apiClient.startPrescriptionSaga({
      patientId,
      patientName,
      medicineId,
      medicineName,
      dosage,
      quantity,
      doctorId,
      doctorName,
      notes,
      idempotencyKey
    });
    if (res?.success) {
      if (res.saga) {
        const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
        sagas.unshift(res.saga);
        setLocalStore(LOCAL_SAGAS_KEY, sagas);
      }
      return res;
    }
  } catch (apiErr) {
    console.warn('[SAGA] Backend start prescription fell back to client:', apiErr.message);
  }

  const medicineRef = getResourceDocRef(medicineId, hospitalId);
  const sagasRef = getSagasCollectionRef(hospitalId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      const medDoc = await t.get(medicineRef);
      if (!medDoc.exists()) {
        throw new Error(`Medicine ${medicineName || medicineId} not found in stock.`);
      }

      const medData = medDoc.data();
      const currentStock = Number(medData.quantity) || 0;
      const requiredQty = Number(quantity);

      if (currentStock < requiredQty) {
        const err = new Error(`Insufficient inventory for ${medData.name}. Available: ${currentStock}, Required: ${requiredQty}`);
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }

      // Decrement stock & increment version
      const newStock = currentStock - requiredQty;
      const newVersion = (medData.version || 1) + 1;

      t.set(medicineRef, {
        ...medData,
        quantity: newStock,
        version: newVersion,
        updatedAt: new Date().toISOString()
      });

      // Create Saga Document
      const sagaId = `saga-rx-${Date.now()}`;
      const sagaRef = doc(sagasRef, sagaId);

      const initialSteps = [
        {
          stepName: 'order',
          label: 'Doctor Prescription Order',
          status: 'done',
          timestamp: new Date().toISOString(),
          actorId: doctorId,
          actorName: doctorName,
          actorRole: 'doctor',
          details: `Prescribed ${requiredQty}x ${medicineName || medData.name} (${dosage})`
        },
        {
          stepName: 'dispense',
          label: 'Pharmacy Stock Dispense',
          status: 'pending',
          timestamp: null,
          actorId: null,
          actorName: null,
          actorRole: 'pharmacy',
          details: 'Queued for pharmacy verification'
        },
        {
          stepName: 'administer',
          label: 'Bedside Nurse Administration',
          status: 'pending',
          timestamp: null,
          actorId: null,
          actorName: null,
          actorRole: 'nurse',
          details: 'Awaiting bedside administration'
        }
      ];

      t.set(sagaRef, {
        id: sagaId,
        type: 'prescription',
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

      // Append Audit Event
      const eventId = `evt-saga-order-${Date.now()}`;
      t.set(doc(eventsRef, eventId), {
        id: eventId,
        type: 'clinical_event',
        resourceId: medicineId,
        actorId: doctorId,
        actorName: doctorName,
        actorRole: 'doctor',
        timestamp: new Date().toISOString(),
        idempotencyKey,
        resultingVersion: newVersion,
        payload: {
          sagaId,
          action: 'PRESCRIPTION_ORDERED',
          patientName,
          medicineName: medicineName || medData.name,
          quantityDeducted: requiredQty,
          remainingStock: newStock
        }
      });

      return { success: true, sagaId, remainingStock: newStock };
    });
  } catch (err) {
    if (err.code === 'INSUFFICIENT_STOCK') throw err;
    console.warn('[SAGA] Using local store for prescription saga:', err.message);

    const resources = getLocalStore(LOCAL_RESOURCES_KEY, []);
    const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
    const events = getLocalStore(LOCAL_EVENTS_KEY, []);

    const medIdx = resources.findIndex(r => r.id === medicineId);
    if (medIdx < 0) throw new Error(`Medicine ${medicineId} not found in local stock.`);

    const med = resources[medIdx];
    const currentStock = Number(med.quantity) || 0;
    const requiredQty = Number(quantity);

    if (currentStock < requiredQty) {
      const e = new Error(`Insufficient inventory for ${med.name}. Available: ${currentStock}, Required: ${requiredQty}`);
      e.code = 'INSUFFICIENT_STOCK';
      throw e;
    }

    const newStock = currentStock - requiredQty;
    resources[medIdx] = { ...med, quantity: newStock, version: (med.version || 1) + 1, updatedAt: new Date().toISOString() };

    const sagaId = `saga-rx-${Date.now()}`;
    const newSaga = {
      id: sagaId,
      type: 'prescription',
      patientId,
      patientName,
      medicineId,
      medicineName: medicineName || med.name,
      dosage,
      quantity: requiredQty,
      status: 'in_progress',
      notes,
      steps: [
        { stepName: 'order', label: 'Doctor Prescription Order', status: 'done', timestamp: new Date().toISOString(), actorId: doctorId, actorName: doctorName, actorRole: 'doctor', details: `Prescribed ${requiredQty}x ${medicineName || med.name}` },
        { stepName: 'dispense', label: 'Pharmacy Stock Dispense', status: 'pending', timestamp: null, actorId: null, actorName: null, actorRole: 'pharmacy', details: 'Queued in Central Pharmacy' },
        { stepName: 'administer', label: 'Bedside Nurse Administration', status: 'pending', timestamp: null, actorId: null, actorName: null, actorRole: 'nurse', details: 'Awaiting bedside administration' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sagas.unshift(newSaga);
    events.unshift({
      id: `evt-saga-order-${Date.now()}`,
      type: 'clinical_event',
      resourceId: medicineId,
      actorId: doctorId,
      actorName: doctorName,
      actorRole: 'doctor',
      timestamp: new Date().toISOString(),
      idempotencyKey,
      resultingVersion: resources[medIdx].version,
      payload: { sagaId, action: 'PRESCRIPTION_ORDERED', patientName, medicineName: medicineName || med.name, quantityDeducted: requiredQty, remainingStock: newStock }
    });

    setLocalStore(LOCAL_RESOURCES_KEY, resources);
    setLocalStore(LOCAL_SAGAS_KEY, sagas);
    setLocalStore(LOCAL_EVENTS_KEY, events);

    return { success: true, sagaId, remainingStock: newStock };
  }
}

/**
 * 2. Advance Prescription Step (Step 2: Dispense or Step 3: Administer)
 */
export async function advancePrescriptionStep({
  hospitalId = DEFAULT_HOSPITAL_ID,
  sagaId,
  stepName,
  actorId,
  actorName,
  actorRole,
  details = '',
  clinicalVitals = null
}) {
  // 1. Try Backend API
  try {
    const res = await apiClient.advancePrescriptionSaga({
      sagaId,
      stepName,
      actorId,
      actorName,
      actorRole,
      details,
      clinicalVitals
    });
    if (res?.success) {
      if (res.saga) {
        const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
        const idx = sagas.findIndex(s => s.id === sagaId);
        if (idx >= 0) sagas[idx] = res.saga;
        setLocalStore(LOCAL_SAGAS_KEY, sagas);
      }
      return res;
    }
  } catch (apiErr) {
    console.warn('[SAGA] Backend advance step fell back to client:', apiErr.message);
  }

  const sagaRef = doc(db, 'hospitals', hospitalId, 'sagas', sagaId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      const sagaDoc = await t.get(sagaRef);
      if (!sagaDoc.exists()) throw new Error(`Saga ${sagaId} not found.`);

      const saga = sagaDoc.data();
      const updatedSteps = saga.steps.map(step => {
        if (step.stepName === stepName) {
          return {
            ...step,
            status: 'done',
            timestamp: new Date().toISOString(),
            actorId,
            actorName,
            actorRole,
            details: details || `Completed by ${actorName}`,
            clinicalVitals
          };
        }
        return step;
      });

      const isCompleted = updatedSteps.every(s => s.status === 'done');
      const newStatus = isCompleted ? 'completed' : 'in_progress';

      t.set(sagaRef, {
        ...saga,
        steps: updatedSteps,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      const eventId = `evt-saga-${stepName}-${Date.now()}`;
      t.set(doc(eventsRef, eventId), {
        id: eventId,
        type: 'clinical_event',
        resourceId: saga.medicineId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        resultingVersion: 1,
        payload: { sagaId, stepName, patientName: saga.patientName, isCompleted, clinicalVitals }
      });

      return { success: true, sagaId, status: newStatus, isCompleted };
    });
  } catch (err) {
    console.warn('[SAGA] Advancing step in local store:', err.message);
    const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
    const events = getLocalStore(LOCAL_EVENTS_KEY, []);

    const sIdx = sagas.findIndex(s => s.id === sagaId);
    if (sIdx < 0) throw new Error(`Saga ${sagaId} not found.`);

    const saga = sagas[sIdx];
    const updatedSteps = saga.steps.map(step => {
      if (step.stepName === stepName) {
        return {
          ...step,
          status: 'done',
          timestamp: new Date().toISOString(),
          actorId,
          actorName,
          actorRole,
          details: details || `Completed by ${actorName}`,
          clinicalVitals
        };
      }
      return step;
    });

    const isCompleted = updatedSteps.every(s => s.status === 'done');
    const newStatus = isCompleted ? 'completed' : 'in_progress';

    sagas[sIdx] = { ...saga, steps: updatedSteps, status: newStatus, updatedAt: new Date().toISOString() };
    events.unshift({
      id: `evt-saga-${stepName}-${Date.now()}`,
      type: 'clinical_event',
      resourceId: saga.medicineId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date().toISOString(),
      resultingVersion: 1,
      payload: { sagaId, stepName, patientName: saga.patientName, isCompleted, clinicalVitals }
    });

    setLocalStore(LOCAL_SAGAS_KEY, sagas);
    setLocalStore(LOCAL_EVENTS_KEY, events);

    return { success: true, sagaId, status: newStatus, isCompleted };
  }
}

/**
 * 3. Compensate / Rollback Saga
 */
export async function compensateSaga({
  hospitalId = DEFAULT_HOSPITAL_ID,
  sagaId,
  actorId,
  actorName,
  actorRole,
  reason = 'Patient allergic reaction or clinician abort'
}) {
  // 1. Try Backend API
  try {
    const res = await apiClient.compensatePrescriptionSaga({
      sagaId,
      actorId,
      actorName,
      actorRole,
      reason
    });
    if (res?.success) {
      if (res.saga) {
        const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
        const idx = sagas.findIndex(s => s.id === sagaId);
        if (idx >= 0) sagas[idx] = res.saga;
        setLocalStore(LOCAL_SAGAS_KEY, sagas);
      }
      return res;
    }
  } catch (apiErr) {
    console.warn('[SAGA] Backend compensation fell back to client:', apiErr.message);
  }

  const sagaRef = doc(db, 'hospitals', hospitalId, 'sagas', sagaId);
  const eventsRef = getEventsCollectionRef(hospitalId);

  try {
    return await runTransaction(db, async (t) => {
      const sagaDoc = await t.get(sagaRef);
      if (!sagaDoc.exists()) throw new Error(`Saga ${sagaId} not found.`);

      const saga = sagaDoc.data();
      if (saga.status === 'compensated') return { success: true, alreadyCompensated: true };

      const medicineRef = getResourceDocRef(saga.medicineId, hospitalId);
      const medDoc = await t.get(medicineRef);
      let newStock = null;
      let newVersion = 1;

      if (medDoc.exists()) {
        const med = medDoc.data();
        newStock = (Number(med.quantity) || 0) + (Number(saga.quantity) || 1);
        newVersion = (med.version || 1) + 1;
        t.set(medicineRef, {
          ...med,
          quantity: newStock,
          version: newVersion,
          updatedAt: new Date().toISOString()
        });
      }

      const compensatedSteps = saga.steps.map(step => {
        return {
          ...step,
          status: step.status === 'done' ? 'compensated' : 'cancelled',
          compensatedAt: new Date().toISOString(),
          compensationReason: reason
        };
      });

      t.set(sagaRef, {
        ...saga,
        steps: compensatedSteps,
        status: 'compensated',
        compensationDetails: { actorId, actorName, actorRole, reason, stockRefunded: saga.quantity, newStockLevel: newStock },
        updatedAt: new Date().toISOString()
      });

      const eventId = `evt-compensate-${Date.now()}`;
      t.set(doc(eventsRef, eventId), {
        id: eventId,
        type: 'saga_compensate',
        resourceId: saga.medicineId,
        actorId,
        actorName,
        actorRole,
        timestamp: new Date().toISOString(),
        resultingVersion: newVersion,
        payload: { sagaId, action: 'SAGA_COMPENSATION_ROLLBACK', patientName: saga.patientName, medicineName: saga.medicineName, stockRefunded: saga.quantity, newStockLevel: newStock, reason }
      });

      return { success: true, sagaId, status: 'compensated', newStock };
    });
  } catch (err) {
    console.warn('[SAGA] Compensating saga in local store:', err.message);
    const sagas = getLocalStore(LOCAL_SAGAS_KEY, []);
    const resources = getLocalStore(LOCAL_RESOURCES_KEY, []);
    const events = getLocalStore(LOCAL_EVENTS_KEY, []);

    const sIdx = sagas.findIndex(s => s.id === sagaId);
    if (sIdx < 0) throw new Error(`Saga ${sagaId} not found.`);

    const saga = sagas[sIdx];
    const medIdx = resources.findIndex(r => r.id === saga.medicineId);
    let newStock = null;
    let newVersion = 1;

    if (medIdx >= 0) {
      const med = resources[medIdx];
      newStock = (Number(med.quantity) || 0) + (Number(saga.quantity) || 1);
      newVersion = (med.version || 1) + 1;
      resources[medIdx] = { ...med, quantity: newStock, version: newVersion, updatedAt: new Date().toISOString() };
    }

    const compensatedSteps = saga.steps.map(step => ({
      ...step,
      status: step.status === 'done' ? 'compensated' : 'cancelled',
      compensatedAt: new Date().toISOString(),
      compensationReason: reason
    }));

    sagas[sIdx] = {
      ...saga,
      steps: compensatedSteps,
      status: 'compensated',
      compensationDetails: { actorId, actorName, actorRole, reason, stockRefunded: saga.quantity, newStockLevel: newStock },
      updatedAt: new Date().toISOString()
    };

    events.unshift({
      id: `evt-compensate-${Date.now()}`,
      type: 'saga_compensate',
      resourceId: saga.medicineId,
      actorId,
      actorName,
      actorRole,
      timestamp: new Date().toISOString(),
      resultingVersion: newVersion,
      payload: { sagaId, action: 'SAGA_COMPENSATION_ROLLBACK', patientName: saga.patientName, medicineName: saga.medicineName, stockRefunded: saga.quantity, newStockLevel: newStock, reason }
    });

    setLocalStore(LOCAL_RESOURCES_KEY, resources);
    setLocalStore(LOCAL_SAGAS_KEY, sagas);
    setLocalStore(LOCAL_EVENTS_KEY, events);

    return { success: true, sagaId, status: 'compensated', newStock };
  }
}
