import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `You are helping a busy doctor know what to check first. Given this list of their patients' pending items, pick the SINGLE most time-sensitive or important one and describe it in one short, plain sentence. If nothing needs attention, say so plainly. Do not use technical terms.`;

/**
 * FUNCTION: Suggested Next Action
 * Scans doctor's patients, pending prescriptions, and recent events to surface
 * the single most relevant item for immediate attention.
 */
export async function getSuggestedAction({
  doctorId = 'doc-1',
  doctorName = 'Dr. Ananya Sharma',
  patients = [],
  sagas = [],
  events = [],
  hospitalId = 'default-hospital'
}) {
  const myPatients = patients.filter(p => p.assignedDoctorId === doctorId || p.assignedDoctorName === doctorName);
  const myPatientIds = myPatients.map(p => p.patientId);

  const mySagas = sagas.filter(s => s.doctorId === doctorId || myPatientIds.includes(s.patientId));
  const pendingDispensed = mySagas.find(s => s.status === 'in_progress' && s.steps?.[1]?.status === 'done' && s.steps?.[2]?.status === 'pending');
  const criticalPatient = myPatients.find(p => p.status === 'critical' && !p.currentBedId);
  const recentRejection = events.find(e => e.type === 'conflict_rejected' && (e.actorId === doctorId || myPatientIds.includes(e.payload?.patientId)));

  // Prepare concise context for Gemini
  const contextSummary = {
    doctor: doctorName,
    assignedPatientsCount: myPatients.length,
    criticalUnallocatedPatients: myPatients.filter(p => !p.currentBedId).map(p => ({ name: p.name, reason: p.diagnosis || p.reason })),
    activePrescriptions: mySagas.filter(s => s.status === 'in_progress').map(s => ({
      patient: s.patientName,
      medicine: s.medicineName,
      dispensed: s.steps?.[1]?.status === 'done',
      administered: s.steps?.[2]?.status === 'done'
    })),
    recentConflict: recentRejection ? { resource: recentRejection.resourceId, reason: recentRejection.payload?.rejectionReason } : null
  };

  try {
    const aiText = await callGemini(
      SYSTEM_PROMPT,
      JSON.stringify(contextSummary, null, 2),
      'gemini-1.5-flash',
      hospitalId
    );

    if (aiText && aiText.trim()) {
      const cleanSentence = aiText.replace(/```/g, '').trim();
      let targetTab = 'patients';
      let urgencyLevel = 'normal';

      if (pendingDispensed) {
        targetTab = 'prescribe';
        urgencyLevel = 'normal';
      } else if (criticalPatient) {
        targetTab = 'request';
        urgencyLevel = 'critical';
      } else if (recentRejection) {
        targetTab = 'escalate';
        urgencyLevel = 'urgent';
      }

      return {
        actionSummary: cleanSentence,
        targetTab,
        urgencyLevel
      };
    }
  } catch (err) {
    console.warn('[Suggested Action] AI call fallback triggered:', err.message);
  }

  // Deterministic smart rule fallback
  if (criticalPatient) {
    return {
      actionSummary: `${criticalPatient.name} is admitted with acute symptoms and is awaiting an ICU bed allocation.`,
      targetTab: 'request',
      urgencyLevel: 'critical'
    };
  }

  if (pendingDispensed) {
    return {
      actionSummary: `${pendingDispensed.patientName}'s ${pendingDispensed.medicineName} was dispensed by Central Pharmacy and is ready for bedside administration.`,
      targetTab: 'prescribe',
      urgencyLevel: 'normal'
    };
  }

  if (recentRejection) {
    return {
      actionSummary: `Your request for ${recentRejection.resourceId} was held for a higher-priority case — select an alternative bed or request an override.`,
      targetTab: 'escalate',
      urgencyLevel: 'urgent'
    };
  }

  if (myPatients.length > 0) {
    return {
      actionSummary: `All ${myPatients.length} of your assigned patients are stable with active orders on track — no urgent actions needed.`,
      targetTab: 'patients',
      urgencyLevel: 'info'
    };
  }

  return {
    actionSummary: 'No active patient alerts or pending orders at this time.',
    targetTab: 'patients',
    urgencyLevel: 'info'
  };
}
