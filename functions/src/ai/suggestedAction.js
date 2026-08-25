import admin from 'firebase-admin';
import { callGemini } from './geminiClient.js';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const SYSTEM_PROMPT = `You are helping a busy doctor know what to check first. Given this list of their patients' pending items, pick the SINGLE most time-sensitive or important one and describe it in one short, plain sentence a doctor can read in 2 seconds. If nothing urgently needs attention, say so plainly, e.g. 'Nothing urgent right now.' Do not use technical terms.`;

/**
 * FUNCTION 5: Suggested Next Action (Doctor Dashboard)
 */
export async function getSuggestedActionLogic(data) {
  const {
    doctorId = 'doc-1',
    doctorName = 'Dr. Ananya Sharma',
    hospitalId = 'default-hospital',
    patients = [],
    sagas = [],
    events = []
  } = data || {};

  let patientList = patients;
  let sagaList = sagas;
  let eventList = events;

  // Firestore fallback if not passed
  if (!patientList.length || !sagaList.length) {
    try {
      const [patSnap, sagaSnap] = await Promise.all([
        db.collection('hospitals').doc(hospitalId).collection('patients').get(),
        db.collection('hospitals').doc(hospitalId).collection('sagas').where('status', '==', 'in_progress').get()
      ]);
      if (!patSnap.empty && !patientList.length) {
        patientList = patSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      if (!sagaSnap.empty && !sagaList.length) {
        sagaList = sagaSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[SuggestedAction] Firestore fetch fallback:', err.message);
    }
  }

  const myPatients = patientList.filter(
    p => p.assignedDoctorId === doctorId || p.assignedDoctorName === doctorName
  );
  const myPatientIds = myPatients.map(p => p.patientId);

  const mySagas = sagaList.filter(
    s => s.doctorId === doctorId || myPatientIds.includes(s.patientId)
  );

  const pendingDispensed = mySagas.find(
    s => s.status === 'in_progress' && s.steps?.[1]?.status === 'done' && s.steps?.[2]?.status === 'pending'
  );
  const criticalPatient = myPatients.find(
    p => p.status === 'critical' && !p.currentBedId
  );
  const recentRejection = eventList.find(
    e => e.type === 'conflict_rejected' && (e.actorId === doctorId || myPatientIds.includes(e.payload?.patientId))
  );

  const contextData = {
    doctor: doctorName,
    assignedPatients: myPatients.length,
    criticalUnallocated: criticalPatient ? { name: criticalPatient.name, reason: criticalPatient.diagnosis } : null,
    dispensedPrescriptionWaitingNurse: pendingDispensed ? { patient: pendingDispensed.patientName, medicine: pendingDispensed.medicineName } : null,
    recentDeclinedRequest: recentRejection ? { resource: recentRejection.resourceId, reason: recentRejection.payload?.rejectionReason } : null
  };

  const aiResult = await callGemini(
    SYSTEM_PROMPT,
    JSON.stringify(contextData, null, 2),
    { hospitalId }
  );

  let relatedTab = 'patients';
  if (pendingDispensed) relatedTab = 'prescribe';
  else if (criticalPatient) relatedTab = 'patients';
  else if (recentRejection) relatedTab = 'escalate';

  if (aiResult.success && aiResult.data) {
    return {
      message: aiResult.data.replace(/```/g, '').trim(),
      relatedTab
    };
  }

  // Deterministic Fallback
  if (criticalPatient) {
    return {
      message: `${criticalPatient.name} is admitted with acute symptoms and is awaiting an ICU bed allocation.`,
      relatedTab: 'patients'
    };
  }

  if (pendingDispensed) {
    return {
      message: `${pendingDispensed.patientName}'s ${pendingDispensed.medicineName} was dispensed by Central Pharmacy and is ready for bedside administration.`,
      relatedTab: 'prescribe'
    };
  }

  if (recentRejection) {
    return {
      message: `Your request for ${recentRejection.resourceId} was held for a higher-urgency emergency — select an alternative bed or request an override.`,
      relatedTab: 'escalate'
    };
  }

  if (myPatients.length > 0) {
    return {
      message: `All ${myPatients.length} of your assigned patients are stable with active orders on track.`,
      relatedTab: 'patients'
    };
  }

  return {
    message: 'Nothing urgent right now.',
    relatedTab: 'patients'
  };
}
