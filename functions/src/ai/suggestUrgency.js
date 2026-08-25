import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `You are a clinical emergency triage AI for hospital resource management.
Analyze the patient's diagnosis and clinical notes, and classify the clinical urgency into EXACTLY ONE of the following 4 levels:

- Critical: Immediate life threat requiring instantaneous resuscitation or ICU beds (e.g. cardiac arrest, refractory ventricular tachycardia/VFib, acute STEMI, acute respiratory failure, septic shock, massive hemorrhagic shock, acute stroke, acute trauma arrest).
- High: Severe acute condition requiring urgent stabilization (e.g. unstable angina, acute abdomen, acute ARDS exacerbation, severe post-op infection, acute hypoxemia).
- Moderate: Stable inpatient condition requiring standard monitored bed or routine inpatient care (e.g. bacterial pneumonia, uncomplicated fracture post-fixation, controlled post-op recovery).
- Low: Non-urgent, outpatient, mild, chronic, or elective complaints (e.g. pediatric growth/height concerns, mild fever/cold, routine follow-up, suture removal, medication refill, cosmetic evaluation).

Respond with ONLY one word: Critical, High, Moderate, or Low. No explanation, no markdown, no other words.`;

const ALLOWED_URGENCIES = ['Critical', 'High', 'Moderate', 'Low'];

/**
 * FUNCTION 2: Suggest Escalation Urgency
 */
export async function suggestUrgencyLogic(data) {
  const {
    reasonText = '',
    patientDiagnosis = '',
    hospitalId = 'default-hospital'
  } = typeof data === 'string' ? { reasonText: data } : (data || {});

  const fullPromptInput = [
    patientDiagnosis ? `Patient Diagnosis: ${patientDiagnosis}` : '',
    reasonText ? `Clinical Notes / Reason: ${reasonText}` : ''
  ].filter(Boolean).join('\n') || 'General clinical observation';

  const aiResult = await callGemini(SYSTEM_PROMPT, fullPromptInput, { hospitalId });

  if (aiResult.success && aiResult.data) {
    const rawWord = aiResult.data.replace(/[^a-zA-Z]/g, '').trim();
    const matched = ALLOWED_URGENCIES.find(
      u => u.toLowerCase() === rawWord.toLowerCase()
    );

    if (matched) {
      return { suggestedUrgency: matched };
    }
    console.warn(`[SuggestUrgency] AI returned non-standard urgency "${aiResult.data}". Defaulting to heuristic.`);
  }

  // Deterministic Medical Keyword Heuristic Fallback
  const lower = (fullPromptInput).toLowerCase();

  // 1. Explicitly Non-Urgent / Outpatient Complaints -> Low
  if (
    lower.includes('height') ||
    lower.includes('growth') ||
    lower.includes('routine') ||
    lower.includes('checkup') ||
    lower.includes('follow-up') ||
    lower.includes('refill') ||
    lower.includes('mild') ||
    lower.includes('suture removal') ||
    lower.includes('vaccination')
  ) {
    // If the reason also doesn't contain acute cardiac/resuscitation keywords
    if (!lower.includes('arrest') && !lower.includes('vtach') && !lower.includes('shock') && !lower.includes('stat')) {
      return { suggestedUrgency: 'Low' };
    }
  }

  // 2. Critical Life Threats -> Critical
  if (
    lower.includes('arrest') ||
    lower.includes('vtach') ||
    lower.includes('v-tach') ||
    lower.includes('ventricular tachycardia') ||
    lower.includes('vfib') ||
    lower.includes('stemi') ||
    lower.includes('resuscitation') ||
    lower.includes('shock') ||
    lower.includes('intubat') ||
    lower.includes('massive hemorrhage')
  ) {
    return { suggestedUrgency: 'Critical' };
  }

  // 3. High Urgency -> High
  if (
    lower.includes('urgent') ||
    lower.includes('unstable') ||
    lower.includes('dyspnea') ||
    lower.includes('chest pain') ||
    lower.includes('hypox') ||
    lower.includes('sepsis') ||
    lower.includes('ards')
  ) {
    return { suggestedUrgency: 'High' };
  }

  // 4. Low keywords
  if (lower.includes('stable') || lower.includes('discharge') || lower.includes('observation')) {
    return { suggestedUrgency: 'Low' };
  }

  return { suggestedUrgency: 'Moderate' };
}
