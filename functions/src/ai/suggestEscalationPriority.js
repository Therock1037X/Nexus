/**
 * AI Feature 2: AI-Assisted Escalation Prioritization
 * Analyzes doctor free-text clinical notes and suggests an urgency level.
 * Advisory only: Final decision is always enforced by deterministic system rules.
 */

import { generateContentWithFallback } from './llmClient.js';

export async function suggestEscalationPriority(clinicalReason = '', apiKey = '') {
  if (!clinicalReason || clinicalReason.trim().length === 0) {
    return {
      suggestedPriority: 'normal',
      confidence: 0.5,
      clinicalRationale: 'No clinical notes provided; defaulting to standard triage.'
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

Output ONLY a valid JSON object matching this structure:
{
  "suggestedPriority": "critical" | "urgent" | "high" | "normal",
  "confidence": 0.0 to 1.0,
  "clinicalRationale": "Short 1-2 sentence medical reasoning."
}`;

  const fallbackClassifier = () => {
    const lower = clinicalReason.toLowerCase();
    if (
      lower.includes('cardiac') || lower.includes('arrest') || lower.includes('stemi') ||
      lower.includes('chest pain') || lower.includes('respiratory distress') || lower.includes('intubat') ||
      lower.includes('shock') || lower.includes('bleeding') || lower.includes('critical') || lower.includes('stat')
    ) {
      return JSON.stringify({
        suggestedPriority: 'critical',
        confidence: 0.92,
        clinicalRationale: 'High-risk cardiovascular/respiratory keywords detected indicating acute life threat.'
      });
    }

    if (
      lower.includes('deteriorat') || lower.includes('sepsis') || lower.includes('hypoten') ||
      lower.includes('tachy') || lower.includes('urgent') || lower.includes('fever') || lower.includes('pain 8') || lower.includes('pain 9')
    ) {
      return JSON.stringify({
        suggestedPriority: 'urgent',
        confidence: 0.85,
        clinicalRationale: 'Clinical indicators suggest active physiological deterioration requiring expedited bed placement.'
      });
    }

    if (lower.includes('post-op') || lower.includes('transfer') || lower.includes('icu') || lower.includes('high')) {
      return JSON.stringify({
        suggestedPriority: 'high',
        confidence: 0.78,
        clinicalRationale: 'Patient requires specialized monitoring post-intervention or during ward step-up.'
      });
    }

    return JSON.stringify({
      suggestedPriority: 'normal',
      confidence: 0.70,
      clinicalRationale: 'Clinical presentation appears hemodynamically stable for standard queue placement.'
    });
  };

  const rawResult = await generateContentWithFallback(prompt, { apiKey, model: 'gemini-2.5-flash' }, fallbackClassifier);

  try {
    const jsonStr = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (parseErr) {
    return JSON.parse(fallbackClassifier());
  }
}
