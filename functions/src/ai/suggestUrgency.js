import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `Read this doctor's note about a patient. Respond with ONLY one word: Critical, High, Moderate, or Low. No explanation, no other text.`;

const ALLOWED_URGENCIES = ['Critical', 'High', 'Moderate', 'Low'];

/**
 * FUNCTION 2: Suggest Escalation Urgency
 */
export async function suggestUrgencyLogic(data) {
  const { reasonText = '', hospitalId = 'default-hospital' } = typeof data === 'string' ? { reasonText: data } : (data || {});

  if (!reasonText || !reasonText.trim()) {
    return { suggestedUrgency: 'Moderate' };
  }

  const aiResult = await callGemini(SYSTEM_PROMPT, reasonText.trim(), { hospitalId });

  if (aiResult.success && aiResult.data) {
    const rawWord = aiResult.data.replace(/[^a-zA-Z]/g, '').trim();
    const matched = ALLOWED_URGENCIES.find(
      u => u.toLowerCase() === rawWord.toLowerCase()
    );

    if (matched) {
      return { suggestedUrgency: matched };
    }
    console.warn(`[SuggestUrgency] AI returned non-standard urgency "${aiResult.data}". Defaulting to Moderate.`);
  }

  // Deterministic Keyword Heuristic Fallback
  const lower = reasonText.toLowerCase();
  if (lower.includes('stat') || lower.includes('arrest') || lower.includes('collapse') || lower.includes('stemi') || lower.includes('intubat')) {
    return { suggestedUrgency: 'Critical' };
  }
  if (lower.includes('urgent') || lower.includes('unstable') || lower.includes('dyspnea') || lower.includes('chest pain') || lower.includes('hypox')) {
    return { suggestedUrgency: 'High' };
  }
  if (lower.includes('routine') || lower.includes('stable') || lower.includes('checkup') || lower.includes('discharge')) {
    return { suggestedUrgency: 'Low' };
  }

  return { suggestedUrgency: 'Moderate' };
}
