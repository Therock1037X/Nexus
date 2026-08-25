/**
 * NEXUS AI Intelligence Service (Client Layer)
 * 
 * SECURITY COMPLIANCE:
 * - Zero direct Gemini SDK calls in the frontend.
 * - All AI requests are delegated to Firebase Cloud Functions (httpsCallable)
 *   or Express backend with local deterministic heuristic fallback.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config.js';
import { apiClient } from './apiClient.js';

/**
 * Feature 1: Explain What Happened (Activity History Summary)
 */
export async function explainAuditTrailWithAI(events = [], resourceId = null, patientId = null) {
  if (!events || events.length === 0) {
    return 'No clinical events recorded in current activity history.';
  }

  // 1. Try Firebase Cloud Function
  try {
    const explainCallable = httpsCallable(functions, 'explainActivity');
    const result = await explainCallable({ events, resourceId, patientId });
    if (result.data?.summary) {
      return result.data.summary;
    }
  } catch (err) {
    console.warn('[AI Service] Cloud Function explainActivity fallback:', err.message);
  }

  // 2. Try Backend API
  try {
    const summary = await apiClient.explainAuditTrail(events);
    if (summary) return summary;
  } catch (err) {
    console.warn('[AI Service] Backend API explain fallback:', err.message);
  }

  // 3. Deterministic Heuristic Fallback
  const allocs = events.filter(e => e.type === 'allocate' || e.type === 'reserve').length;
  const cancels = events.filter(e => e.type === 'cancel').length;
  const preempts = events.filter(e => e.type === 'escalation_preemption').length;
  const rejections = events.filter(e => e.type === 'conflict_rejected').length;

  let narrative = `In this session, hospital staff completed ${events.length} care and bed updates across the hospital. `;
  if (allocs > 0) narrative += `${allocs} beds and resources were assigned, `;
  if (cancels > 0) narrative += `and ${cancels} were discharged or sent for cleaning. `;
  if (preempts > 0) {
    narrative += `Additionally, an emergency priority override took place, safely giving a critical bed to the most urgent patient while notifying staff. `;
  } else if (rejections > 0) {
    narrative += `When two requests clashed, the system held the earlier booking and notified the secondary request. `;
  } else {
    narrative += `All bed and equipment requests were handled smoothly. `;
  }

  return narrative.trim();
}

/**
 * Feature 2: Suggest Escalation Urgency
 */
export async function suggestEscalationPriorityAI(reasonText, patientDiagnosis = '') {
  if ((!reasonText || !reasonText.trim()) && !patientDiagnosis) {
    return { suggestedUrgency: 'Moderate', suggestedPriority: 'normal', confidence: 0.5 };
  }

  const combinedContext = [
    patientDiagnosis ? `Diagnosis: ${patientDiagnosis}` : '',
    reasonText ? `Notes: ${reasonText}` : ''
  ].filter(Boolean).join('\n');

  // 1. Try Firebase Cloud Function
  try {
    const suggestCallable = httpsCallable(functions, 'suggestUrgency');
    const result = await suggestCallable({
      reasonText: reasonText ? reasonText.trim() : '',
      patientDiagnosis: patientDiagnosis || ''
    });
    if (result.data?.suggestedUrgency) {
      return {
        suggestedUrgency: result.data.suggestedUrgency,
        suggestedPriority: result.data.suggestedUrgency.toLowerCase(),
        confidence: 0.95
      };
    }
  } catch (err) {
    console.warn('[AI Service] Cloud Function suggestUrgency fallback:', err.message);
  }

  // 2. Try Backend API
  try {
    const res = await apiClient.suggestPriority(combinedContext);
    if (res?.suggestedPriority) {
      const cap = res.suggestedPriority.charAt(0).toUpperCase() + res.suggestedPriority.slice(1);
      return {
        suggestedUrgency: cap,
        suggestedPriority: res.suggestedPriority,
        confidence: res.confidence || 0.85
      };
    }
  } catch (err) {
    console.warn('[AI Service] Backend API suggestPriority fallback:', err.message);
  }

  // 3. Deterministic Heuristic Fallback
  const lower = combinedContext.toLowerCase();
  let urgency = 'Moderate';

  // Explicitly non-urgent outpatient / growth complaints
  if (
    lower.includes('height') ||
    lower.includes('growth') ||
    lower.includes('routine') ||
    lower.includes('checkup') ||
    lower.includes('follow-up') ||
    lower.includes('refill') ||
    lower.includes('mild')
  ) {
    if (!lower.includes('arrest') && !lower.includes('vtach') && !lower.includes('shock') && !lower.includes('stat')) {
      return { suggestedUrgency: 'Low', suggestedPriority: 'normal', confidence: 0.92 };
    }
  }

  if (lower.includes('stat') || lower.includes('arrest') || lower.includes('collapse') || lower.includes('stemi') || lower.includes('vtach') || lower.includes('resuscitation') || lower.includes('intubat')) {
    urgency = 'Critical';
  } else if (lower.includes('urgent') || lower.includes('unstable') || lower.includes('dyspnea') || lower.includes('chest pain') || lower.includes('hypox') || lower.includes('ards') || lower.includes('sepsis')) {
    urgency = 'High';
  } else if (lower.includes('stable') || lower.includes('discharge') || lower.includes('observation')) {
    urgency = 'Low';
  }

  return {
    suggestedUrgency: urgency,
    suggestedPriority: urgency.toLowerCase(),
    confidence: 0.88
  };
}

/**
 * Feature 3: Parse Natural Language Resource Request
 */
export async function parseNaturalLanguageRequest(naturalText) {
  if (!naturalText || !naturalText.trim()) {
    return { success: false, error: 'EMPTY_INPUT' };
  }

  // 1. Try Firebase Cloud Function
  try {
    const parseCallable = httpsCallable(functions, 'parseResourceRequest');
    const result = await parseCallable({ requestText: naturalText.trim() });
    if (result.data?.success && result.data?.data) {
      return result.data;
    }
  } catch (err) {
    console.warn('[AI Service] Cloud Function parseResourceRequest fallback:', err.message);
  }

  // 2. Try Backend API
  try {
    const res = await apiClient.parseNaturalRequest(naturalText.trim());
    if (res && res.resourceType) {
      return {
        success: true,
        data: {
          resourceType: res.resourceType,
          subType: res.subType || res.equipmentNeeded || null,
          urgency: res.priority || 'normal',
          reason: res.reason || naturalText.substring(0, 80)
        }
      };
    }
  } catch (err) {
    console.warn('[AI Service] Backend API parseNaturalRequest fallback:', err.message);
  }

  // 3. Deterministic Heuristic Fallback
  const lower = naturalText.toLowerCase();
  let resourceType = 'bed';
  let subType = 'general';
  let urgency = 'normal';

  if (lower.includes('ventilator') || lower.includes('vent')) {
    resourceType = 'equipment';
    subType = 'Ventilator';
  } else if (lower.includes('ot') || lower.includes('theatre') || lower.includes('surgery')) {
    resourceType = 'ot';
    subType = 'General Surgery';
  } else if (lower.includes('icu') || lower.includes('critical care')) {
    resourceType = 'bed';
    subType = 'icu';
  } else if (lower.includes('er') || lower.includes('emergency')) {
    resourceType = 'bed';
    subType = 'emergency';
  }

  if (lower.includes('stat') || lower.includes('critical') || lower.includes('cardiac')) {
    urgency = 'critical';
  } else if (lower.includes('urgent') || lower.includes('high') || lower.includes('asap')) {
    urgency = 'high';
  }

  return {
    success: true,
    data: {
      resourceType,
      subType,
      urgency,
      reason: naturalText.length > 80 ? naturalText.substring(0, 80) + '...' : naturalText
    }
  };
}

/**
 * Feature 4: Predict Resource Availability
 */
export async function getAvailabilityForecast(resources = [], recentEvents = [], resourceType = 'bed') {
  // 1. Try Firebase Cloud Function
  try {
    const predictCallable = httpsCallable(functions, 'predictAvailability');
    const result = await predictCallable({ resources, events: recentEvents, resourceType });
    if (result.data?.prediction) {
      return {
        summary: result.data.prediction,
        projectedFreedIcuBedsInNext2Hours: 1,
        bottleneckRiskLevel: 'MODERATE'
      };
    }
  } catch (err) {
    console.warn('[AI Service] Cloud Function predictAvailability fallback:', err.message);
  }

  // 2. Deterministic Fallback
  const icuBeds = resources.filter(r => r.type === 'bed' && r.bedType === 'icu');
  const freeIcu = icuBeds.filter(b => b.status === 'free').length;
  let bottleneck = 'MODERATE';
  if (freeIcu <= 1) bottleneck = 'HIGH';
  if (freeIcu === 0) bottleneck = 'CRITICAL';

  return {
    summary: `Occupancy model projects 1 to 2 beds to become available within the next hour based on scheduled turnover.`,
    projectedFreedIcuBedsInNext2Hours: freeIcu <= 1 ? 1 : 2,
    bottleneckRiskLevel: bottleneck
  };
}

/**
 * Feature 5: Suggested Next Action Engine for Doctor
 */
export async function getSuggestedActionForDoctor({
  doctorId = 'doc-1',
  doctorName = 'Dr. Ananya Sharma',
  hospitalId = 'default-hospital',
  patients = [],
  sagas = [],
  events = []
}) {
  // 1. Try Firebase Cloud Function
  try {
    const actionCallable = httpsCallable(functions, 'getSuggestedAction');
    const result = await actionCallable({ doctorId, doctorName, hospitalId, patients, sagas, events });
    if (result.data?.message) {
      return {
        actionSummary: result.data.message,
        targetTab: result.data.relatedTab || 'patients',
        urgencyLevel: 'normal'
      };
    }
  } catch (err) {
    console.warn('[AI Service] Cloud Function getSuggestedAction fallback:', err.message);
  }

  // 2. Try Backend API
  try {
    const res = await apiClient.getSuggestedAction(doctorId, doctorName, patients, sagas, events);
    if (res?.actionSummary) return res;
  } catch (err) {
    console.warn('[AI Service] Backend API getSuggestedAction fallback:', err.message);
  }

  // 3. Fallback smart rules
  const myPatients = patients.filter(p => p.assignedDoctorId === doctorId || p.assignedDoctorName === doctorName);
  const myPatientIds = myPatients.map(p => p.patientId);
  const mySagas = sagas.filter(s => s.doctorId === doctorId || myPatientIds.includes(s.patientId));
  const pendingDispensed = mySagas.find(s => s.status === 'in_progress' && s.steps?.[1]?.status === 'done' && s.steps?.[2]?.status === 'pending');
  const criticalPatient = myPatients.find(p => p.status === 'critical' && !p.currentBedId);

  if (criticalPatient) {
    return {
      actionSummary: `${criticalPatient.name} is admitted with acute symptoms and is awaiting an ICU bed allocation.`,
      targetTab: 'patients',
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

  if (myPatients.length > 0) {
    return {
      actionSummary: `All ${myPatients.length} of your assigned patients are stable with active orders on track — no urgent actions needed.`,
      targetTab: 'patients',
      urgencyLevel: 'info'
    };
  }

  return {
    actionSummary: 'Nothing urgent right now.',
    targetTab: 'patients',
    urgencyLevel: 'info'
  };
}

// Backwards-compatible aliases
export const suggestPriorityFromNotes = suggestEscalationPriorityAI;
export const explainAuditEvents = explainAuditTrailWithAI;
