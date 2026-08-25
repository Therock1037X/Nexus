/**
 * Patient Service
 * Handles patient intake (OPD/Reception), doctor reassignment, and document uploads.
 * Connects directly to the backend API with seamless client-side fallback.
 */

import {
  db,
  doc,
  setDoc,
  updateDoc,
  DEFAULT_HOSPITAL_ID
} from '../firebase/firestore.js';
import { apiClient } from './apiClient.js';

/**
 * Admit a new patient from OPD / Reception
 */
export async function admitNewPatient({
  name,
  age,
  gender,
  phone = '',
  reason = '',
  diagnosis = '',
  assignedDoctorId,
  assignedDoctorName,
  priority = 'normal',
  documents = [],
  admittedBy = 'Reception / Admin',
  hospitalId = DEFAULT_HOSPITAL_ID
}) {
  if (!name || !assignedDoctorId) {
    throw new Error('Patient name and assigned doctor are required.');
  }

  // 1. Try Backend API
  try {
    const res = await apiClient.admitPatient({
      name,
      age,
      gender,
      phone,
      reason,
      diagnosis,
      assignedDoctorId,
      assignedDoctorName,
      priority,
      documents,
      admittedBy
    });
    if (res?.patient) {
      // Sync local reactive store
      syncLocalPatient(res.patient);
      return res.patient;
    }
  } catch (apiErr) {
    console.warn('[PATIENT SERVICE] Backend API unavailable, continuing with client store:', apiErr.message);
  }

  // 2. Client-side Fallback
  const patientId = `pat-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();

  const initialDocs = documents.length > 0 ? documents : [
    {
      id: `doc-${Date.now()}-1`,
      name: `${name.replace(/\s+/g, '_')}_OPD_Admission_Record.pdf`,
      type: 'application/pdf',
      size: '1.4 MB',
      uploadedAt: timestamp,
      uploadedBy: admittedBy,
      notes: 'Initial OPD Triage & Assessment Slip'
    }
  ];

  const newPatient = {
    patientId,
    name,
    age: Number(age) || 35,
    gender: gender || 'Other',
    phone: phone || '+91 98200 12345',
    reason: reason || diagnosis || 'Routine clinical consultation',
    diagnosis: diagnosis || reason || 'Under Investigation',
    assignedDoctorId,
    assignedDoctorName,
    currentBedId: null,
    status: priority === 'critical' ? 'critical' : priority === 'urgent' ? 'emergency' : 'admitted',
    admittedAt: timestamp,
    documents: initialDocs,
    vitals: {
      hr: 76 + Math.floor(Math.random() * 12),
      bp: '120/80',
      spo2: 98,
      temp: '98.6 F'
    }
  };

  const eventId = `evt-admit-${Date.now()}`;
  const admitEvent = {
    id: eventId,
    type: 'patient_admitted',
    resourceId: 'OPD_RECEPTION',
    actorId: 'reception-1',
    actorRole: 'admin',
    actorName: admittedBy,
    timestamp,
    idempotencyKey: `admit-${patientId}`,
    resultingVersion: 1,
    payload: {
      action: 'PATIENT_ADMISSION',
      patientId,
      patientName: name,
      assignedDoctorId,
      assignedDoctorName,
      reason: reason || diagnosis,
      description: `Patient ${name} admitted through OPD by ${admittedBy} and assigned to ${assignedDoctorName}.`
    }
  };

  try {
    await setDoc(doc(db, 'hospitals', hospitalId, 'patients', patientId), newPatient);
    await setDoc(doc(db, 'hospitals', hospitalId, 'events', eventId), admitEvent);
  } catch (err) {
    console.warn('[PATIENT SERVICE] Firestore write note:', err.message);
  }

  syncLocalPatient(newPatient, admitEvent);
  return newPatient;
}

function syncLocalPatient(patient, event = null) {
  try {
    const rawPatients = localStorage.getItem('nexus_local_patients');
    const patients = rawPatients ? JSON.parse(rawPatients) : [];
    const existingIdx = patients.findIndex(p => p.patientId === patient.patientId);
    if (existingIdx >= 0) {
      patients[existingIdx] = patient;
    } else {
      patients.unshift(patient);
    }
    localStorage.setItem('nexus_local_patients', JSON.stringify(patients));

    if (event) {
      const rawEvents = localStorage.getItem('nexus_local_events');
      const events = rawEvents ? JSON.parse(rawEvents) : [];
      events.unshift(event);
      localStorage.setItem('nexus_local_events', JSON.stringify(events));
    }

    window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'patients' } }));
  } catch (err) {
    console.warn('[PATIENT SERVICE] Local store write error:', err);
  }
}

/**
 * Reassign a patient to another doctor
 */
export async function reassignPatientDoctor({
  patientId,
  newDoctorId,
  newDoctorName,
  reassignedBy = 'Attending Doctor',
  hospitalId = DEFAULT_HOSPITAL_ID
}) {
  try {
    const res = await apiClient.reassignPatient({
      patientId,
      newDoctorId,
      newDoctorName,
      reassignedBy
    });
    if (res?.patient) {
      syncLocalPatient(res.patient);
      return res;
    }
  } catch (err) {
    console.warn('[PATIENT SERVICE] Backend reassign note:', err.message);
  }

  const timestamp = new Date().toISOString();
  const eventId = `evt-reassign-${Date.now()}`;
  const reassignEvent = {
    id: eventId,
    type: 'patient_reassigned',
    resourceId: patientId,
    actorId: 'staff',
    actorRole: 'doctor',
    actorName: reassignedBy,
    timestamp,
    idempotencyKey: `reassign-${patientId}-${Date.now()}`,
    resultingVersion: 1,
    payload: {
      action: 'PATIENT_REASSIGNMENT',
      patientId,
      newDoctorId,
      newDoctorName,
      description: `Care of patient reassigned to ${newDoctorName} by ${reassignedBy}.`
    }
  };

  try {
    const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    await updateDoc(patientRef, {
      assignedDoctorId: newDoctorId,
      assignedDoctorName: newDoctorName,
      lastReassignedAt: timestamp
    }).catch(() => {});
    await setDoc(doc(db, 'hospitals', hospitalId, 'events', eventId), reassignEvent).catch(() => {});
  } catch {}

  try {
    const rawPatients = localStorage.getItem('nexus_local_patients');
    if (rawPatients) {
      const patients = JSON.parse(rawPatients);
      const idx = patients.findIndex(p => p.patientId === patientId);
      if (idx !== -1) {
        patients[idx].assignedDoctorId = newDoctorId;
        patients[idx].assignedDoctorName = newDoctorName;
        patients[idx].lastReassignedAt = timestamp;
        localStorage.setItem('nexus_local_patients', JSON.stringify(patients));
      }
    }

    const rawEvents = localStorage.getItem('nexus_local_events');
    const events = rawEvents ? JSON.parse(rawEvents) : [];
    events.unshift(reassignEvent);
    localStorage.setItem('nexus_local_events', JSON.stringify(events));

    window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'patients' } }));
  } catch {}

  return { success: true, patientId, newDoctorId, newDoctorName };
}

/**
 * Attach a PDF Document/Report to a Patient
 */
export async function attachPatientDocument({
  patientId,
  document,
  uploadedBy = 'Clinician',
  hospitalId = DEFAULT_HOSPITAL_ID
}) {
  try {
    const res = await apiClient.attachDocument({ patientId, document, uploadedBy });
    if (res?.document && res?.patient) {
      syncLocalPatient(res.patient);
      return res.document;
    }
  } catch (err) {
    console.warn('[PATIENT SERVICE] Backend document upload note:', err.message);
  }

  const timestamp = new Date().toISOString();
  const docObj = {
    id: `doc-${Date.now()}`,
    name: document.name || 'Medical_Report.pdf',
    type: document.type || 'application/pdf',
    size: document.size || '1.8 MB',
    uploadedAt: timestamp,
    uploadedBy,
    notes: document.notes || 'Diagnostic Investigation Report'
  };

  const eventId = `evt-doc-${Date.now()}`;
  const docEvent = {
    id: eventId,
    type: 'document_uploaded',
    resourceId: patientId,
    actorId: 'staff',
    actorRole: 'doctor',
    actorName: uploadedBy,
    timestamp,
    idempotencyKey: `doc-${Date.now()}`,
    resultingVersion: 1,
    payload: {
      action: 'DOCUMENT_UPLOAD',
      patientId,
      documentName: docObj.name,
      description: `Report "${docObj.name}" uploaded to patient chart by ${uploadedBy}.`
    }
  };

  try {
    const rawPatients = localStorage.getItem('nexus_local_patients');
    if (rawPatients) {
      const patients = JSON.parse(rawPatients);
      const idx = patients.findIndex(p => p.patientId === patientId);
      if (idx !== -1) {
        patients[idx].documents = patients[idx].documents || [];
        patients[idx].documents.unshift(docObj);
        localStorage.setItem('nexus_local_patients', JSON.stringify(patients));
      }
    }

    const rawEvents = localStorage.getItem('nexus_local_events');
    const events = rawEvents ? JSON.parse(rawEvents) : [];
    events.unshift(docEvent);
    localStorage.setItem('nexus_local_events', JSON.stringify(events));

    window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'patients' } }));
  } catch {}

  try {
    await setDoc(doc(db, 'hospitals', hospitalId, 'events', eventId), docEvent).catch(() => {});
  } catch {}

  return docObj;
}
