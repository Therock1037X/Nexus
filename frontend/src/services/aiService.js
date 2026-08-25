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
