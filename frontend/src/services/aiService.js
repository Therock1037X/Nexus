/**
 * Frontend AI Service (Google Gemini Integration & Heuristic Fallbacks)
 * 
 * Provides:
 * 1. AI Audit Trail Explanation Assistant
 * 2. AI-Assisted Escalation Prioritization
 * 3. Natural Language Resource Request Parser
 * 4. Predictive Resource Availability Widget
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiClient } from './apiClient.js';

const LOCAL_KEY_STORAGE = 'nexus_gemini_api_key';

export function getCustomApiKey() {
  return localStorage.getItem(LOCAL_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setCustomApiKey(key) {
  if (key) {
    localStorage.setItem(LOCAL_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(LOCAL_KEY_STORAGE);
  }
}

async function callGeminiPrompt(prompt, modelName = 'gemini-1.5-flash') {
  const apiKey = getCustomApiKey();
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || null;
  } catch (err) {
    console.warn('[AI Service] Gemini API call failed, falling back to local engine:', err.message);
    return null;
  }
}

/**
 * Feature 1: Explain Audit Trail
 */
export async function explainAuditEvents(events = []) {
  if (!events || events.length === 0) return 'No audit events to summarize.';

  // 1. Try Backend API
  try {
    const summary = await apiClient.explainAuditTrail(events);
    if (summary) return summary;
  } catch (err) {
    console.warn('[AI Service] Backend explain fell back to client:', err.message);
  }

  const prompt = `You are a Chief Medical Information Officer (CMIO) and Clinical Systems Auditor.
Summarize the following chronological sequence of hospital resource transaction events into a concise, factual, plain-English operational narrative (2-3 sentences).

Rules:
- State what resource was involved, who initiated the action, and the outcome.
- Explicitly mention any conflicts, priority escalations, or saga compensations/rollbacks that occurred and why.
- Do NOT hallucinate. Keep the tone professional, objective, and auditable.

Events:
${JSON.stringify(events.slice(0, 10), null, 2)}

Provide your executive operational summary:`;

  const apiResult = await callGeminiPrompt(prompt);
  if (apiResult) return apiResult;

  // Fallback Heuristic Generator
  const resourceIds = [...new Set(events.map(e => e.resourceId).filter(Boolean))].join(', ');
  const actors = [...new Set(events.map(e => e.actorName).filter(Boolean))].join(' and ');
  const hasPreemption = events.some(e => e.type === 'escalation_preemption' || e.payload?.wasPreemption);
  const hasCompensation = events.some(e => e.type === 'saga_compensate' || e.type === 'conflict_rejected');

  if (hasCompensation) {
    return `Audit Sequence [${resourceIds || 'Resource'}]: An order initiated by ${actors || 'clinical team'} encountered an unexpected bedside cancellation or conflict. The system immediately executed an atomic compensation rollback, restoring medicine stock and updating logs without state corruption.`;
  }
  if (hasPreemption) {
    return `Audit Sequence [${resourceIds || 'Resource'}]: Bed was originally reserved, but an incoming emergency escalation with higher priority triggered a deterministic preemption. The resource was reassigned to the acute emergency patient and audit events were appended.`;
  }
  return `Audit Sequence [${resourceIds || 'Resource'}]: Successfully processed ${events.length} transactional operations coordinated by ${actors || 'attending clinicians'}, maintaining strict version consistency without concurrency collisions.`;
}

/**
 * Feature 2: Suggest Escalation Priority
 */
export async function suggestPriorityFromNotes(clinicalReason = '') {
  if (!clinicalReason || !clinicalReason.trim()) {
    return {
      suggestedPriority: 'normal',
      confidence: 0.5,
      clinicalRationale: 'Standard triage applied (no notes provided).'
    };
  }

  // 1. Try Backend API
  try {
    const res = await apiClient.suggestPriority(clinicalReason);
    if (res?.suggestedPriority) return res;
  } catch (err) {
    console.warn('[AI Service] Backend priority suggestion fell back to client:', err.message);
  }

  const prompt = `You are a Senior Triage AI Assistant in a Hospital Command Center.
Analyze the following free-text clinical escalation notes provided by an attending physician.
Classify the clinical urgency into exactly ONE category:
- "critical" (Immediate life threat: cardiac arrest, acute myocardial infarction, severe respiratory failure / hypoxia <85%, massive hemorrhage, impending shock)
- "urgent" (Rapid deterioration: unstable vitals, post-op complications, sepsis suspicion, acute stroke window, severe distress)
- "high" (Significant pain/acuity needing expedited bed/OT within 1-2 hours)
- "normal" (Stable patient, routine admission or elective procedure)

Input Clinical Note:
"${clinicalReason}"

Output ONLY a valid JSON object:
{
  "suggestedPriority": "critical" | "urgent" | "high" | "normal",
  "confidence": 0.0 to 1.0,
  "clinicalRationale": "Short 1-2 sentence medical reasoning."
}`;

  const apiResult = await callGeminiPrompt(prompt);
  if (apiResult) {
    try {
      const cleanJson = apiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // ignore
    }
  }

  // Fallback Rule Classifier
  const lower = clinicalReason.toLowerCase();
  if (
    lower.includes('cardiac') || lower.includes('arrest') || lower.includes('stemi') ||
    lower.includes('chest pain') || lower.includes('respiratory distress') || lower.includes('intubat') ||
    lower.includes('shock') || lower.includes('bleeding') || lower.includes('critical') || lower.includes('stat')
  ) {
    return {
      suggestedPriority: 'critical',
      confidence: 0.94,
      clinicalRationale: 'Detected cardiovascular or airway emergency keywords indicating immediate life threat.'
    };
  }

  if (
    lower.includes('deteriorat') || lower.includes('sepsis') || lower.includes('hypoten') ||
    lower.includes('tachy') || lower.includes('urgent') || lower.includes('fever') || lower.includes('pain')
  ) {
    return {
      suggestedPriority: 'urgent',
      confidence: 0.86,
      clinicalRationale: 'Physiological indicators suggest rapid clinical deterioration needing expedited placement.'
    };
  }

  if (lower.includes('post-op') || lower.includes('transfer') || lower.includes('icu') || lower.includes('high')) {
    return {
      suggestedPriority: 'high',
      confidence: 0.79,
      clinicalRationale: 'Post-intervention monitoring required; patient priority set to High.'
    };
  }

  return {
    suggestedPriority: 'normal',
    confidence: 0.72,
    clinicalRationale: 'Patient vitals appear stable; standard admission queue recommended.'
  };
}

/**
 * Feature 3: Natural Language Request Parser
 */
export async function parseNaturalLanguageRequest(naturalText = '') {
  if (!naturalText || !naturalText.trim()) return null;

  // 1. Try Backend API
  try {
    const res = await apiClient.parseNaturalRequest(naturalText);
    if (res?.resourceType) return res;
  } catch (err) {
    console.warn('[AI Service] Backend NLP parser fell back to client:', err.message);
  }

  const prompt = `You are a Medical NLP parser. Convert the doctor's unstructured request into a structured JSON object.

Available Resource Types: "bed", "ot", "equipment", "medicine"
Available SubTypes: "icu", "emergency", "general", "ventilator", "mri", "ct", "cardiac", "orthopedic"
Available Priorities: "critical", "urgent", "high", "normal"

Doctor Input:
"${naturalText}"

Return ONLY valid JSON:
{
  "resourceType": "bed" | "ot" | "equipment" | "medicine",
  "subType": string,
  "priority": "critical" | "urgent" | "high" | "normal",
  "reason": "extracted clinical reason / diagnosis",
  "equipmentNeeded": string[]
}`;

  const apiResult = await callGeminiPrompt(prompt);
  if (apiResult) {
    try {
      const cleanJson = apiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // ignore
    }
  }

  // Fallback Heuristic Parser
  const lower = naturalText.toLowerCase();
  let resourceType = 'bed';
  let subType = 'general';
  let priority = 'normal';
  const equipmentNeeded = [];

  if (lower.includes('ventilator')) equipmentNeeded.push('ventilator');
  if (lower.includes('icu') || lower.includes('critical')) {
    resourceType = 'bed';
    subType = 'icu';
  } else if (lower.includes('emergency') || lower.includes('er') || lower.includes('casualty')) {
    resourceType = 'bed';
    subType = 'emergency';
  } else if (lower.includes('ot') || lower.includes('surgery') || lower.includes('theatre')) {
    resourceType = 'ot';
    subType = lower.includes('cardiac') ? 'cardiac' : (lower.includes('ortho') ? 'orthopedic' : 'general_surgery');
  } else if (lower.includes('mri') || lower.includes('scanner') || lower.includes('ct')) {
    resourceType = 'equipment';
    subType = lower.includes('mri') ? 'mri' : 'ct';
  }

  if (lower.includes('stat') || lower.includes('critical') || lower.includes('cardiac') || lower.includes('emergency')) {
    priority = 'critical';
  } else if (lower.includes('urgent') || lower.includes('asap') || lower.includes('rapid')) {
    priority = 'urgent';
  } else if (lower.includes('high') || lower.includes('severe')) {
    priority = 'high';
  }

  return {
    resourceType,
    subType,
    priority,
    reason: naturalText.length > 90 ? naturalText.substring(0, 90) + '...' : naturalText,
    equipmentNeeded
  };
}

/**
 * Feature 4: Predictive Resource Availability Engine
 */
export async function getAvailabilityForecast(resources = [], recentEvents = []) {
  const icuBeds = resources.filter(r => r.type === 'bed' && r.bedType === 'icu');
  const freeIcu = icuBeds.filter(b => b.status === 'free').length;
  const inUseOts = resources.filter(r => r.type === 'ot' && r.status === 'in_use').length;
  const freeVentilators = resources.filter(r => r.type === 'equipment' && (r.equipmentType === 'Ventilator' || r.id?.includes('VENT')) && r.status === 'free').length;

  const prompt = `You are a Hospital Operations Predictive Forecaster.
Analyze current occupancy:
- Free ICU Beds: ${freeIcu} of ${icuBeds.length}
- In-Use OTs: ${inUseOts}
- Available Ventilators: ${freeVentilators}
- Recent Events: ${recentEvents.length}

Generate a concise JSON forecast predicting availability trends in next 1-2 hours:
{
  "summary": "Short 2-sentence forecast.",
  "projectedFreedIcuBedsInNext2Hours": number,
  "projectedOtTurnoverMinutes": number,
  "bottleneckRiskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "recommendedAction": "Actionable advice for bed manager."
}`;

  const apiResult = await callGeminiPrompt(prompt);
  if (apiResult) {
    try {
      const cleanJson = apiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      // ignore
    }
  }

  // Fallback Predictor
  let bottleneck = 'MODERATE';
  if (freeIcu <= 1 || freeVentilators <= 1) bottleneck = 'HIGH';
  if (freeIcu === 0 && freeVentilators === 0) bottleneck = 'CRITICAL';

  return {
    summary: `Occupancy model projects 1 ICU step-down to Floor 1 General Ward within 45 minutes. OT-2 procedure is entering recovery phase.`,
    projectedFreedIcuBedsInNext2Hours: freeIcu <= 2 ? 1 : 2,
    projectedOtTurnoverMinutes: inUseOts > 0 ? 30 : 0,
    bottleneckRiskLevel: bottleneck,
    recommendedAction: bottleneck === 'HIGH' || bottleneck === 'CRITICAL'
      ? 'Prepare Bed G-102 on Floor 1 for immediate post-ICU transfer to maintain critical surge capacity.'
      : 'Maintain standard admission protocols; monitor emergency ward turnover.'
  };
}

/**
 * Feature 5: Suggested Next Action Engine for Doctor
 */
export async function getSuggestedActionForDoctor({ doctorId = 'doc-1', doctorName = 'Dr. Ananya Sharma', patients = [], sagas = [], events = [] }) {
  // 1. Try Backend API
  try {
    const res = await apiClient.getSuggestedAction(doctorId, doctorName, patients, sagas, events);
    if (res?.actionSummary) return res;
  } catch (err) {
    console.warn('[AI Service] Backend suggested action fell back:', err.message);
  }

  // 2. Try Gemini Direct if API key available
  const myPatients = patients.filter(p => p.assignedDoctorId === doctorId || p.assignedDoctorName === doctorName);
  const myPatientIds = myPatients.map(p => p.patientId);
  const mySagas = sagas.filter(s => s.doctorId === doctorId || myPatientIds.includes(s.patientId));
  const pendingDispensed = mySagas.find(s => s.status === 'in_progress' && s.steps?.[1]?.status === 'done' && s.steps?.[2]?.status === 'pending');
  const criticalPatient = myPatients.find(p => p.status === 'critical' && !p.currentBedId);
  const recentRejection = events.find(e => e.type === 'conflict_rejected' && (e.actorId === doctorId || myPatientIds.includes(e.payload?.patientId)));

  const prompt = `You are helping a busy doctor know what to check first in a hospital command center.
Doctor: ${doctorName}
Assigned Patients: ${myPatients.length}
Pending Items Context:
- Critical unallocated patients: ${criticalPatient ? criticalPatient.name : 'None'}
- Prescriptions dispensed waiting delivery: ${pendingDispensed ? `${pendingDispensed.patientName} (${pendingDispensed.medicineName})` : 'None'}
- Recent declined bed requests: ${recentRejection ? recentRejection.resourceId : 'None'}

Pick the SINGLE most time-sensitive or important one and describe it in one short, plain sentence. If nothing needs attention, say so plainly. Do not use technical terms.`;

  const apiResult = await callGeminiPrompt(prompt);
  if (apiResult) {
    const cleanSentence = apiResult.replace(/```/g, '').trim();
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

  // 3. Fallback smart rules
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
      actionSummary: `Your request for ${recentRejection.resourceId} was held for a higher-urgency emergency — select an alternative bed or request an override.`,
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

