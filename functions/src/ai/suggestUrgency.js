import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `You are helping a hospital system estimate urgency from a doctor's note. Read the text and respond with ONLY one word: Critical, High, Moderate, or Low. Do not explain your reasoning. Do not add any other text.`;

/**
 * FUNCTION 2: Suggest Escalation Urgency
 * Returns: { aiSuggestedPriority: 'Critical' | 'High' | 'Moderate' | 'Low', confidence: number }
 */
export async function suggestUrgency(clinicalReason = '', hospitalId = 'default-hospital') {
  if (!clinicalReason || !clinicalReason.trim()) {
    return {
      aiSuggestedPriority: 'Low',
      confidence: 0.5
    };
  }

  try {
    const rawAiText = await callGemini(SYSTEM_PROMPT, clinicalReason.trim(), 'gemini-1.5-flash', hospitalId);
    if (rawAiText) {
      const cleanWord = rawAiText.replace(/[^a-zA-Z]/g, '').trim();
      const lower = cleanWord.toLowerCase();

      if (lower.includes('critical')) return { aiSuggestedPriority: 'Critical', confidence: 0.95 };
      if (lower.includes('high')) return { aiSuggestedPriority: 'High', confidence: 0.88 };
      if (lower.includes('mod')) return { aiSuggestedPriority: 'Moderate', confidence: 0.80 };
      if (lower.includes('low')) return { aiSuggestedPriority: 'Low', confidence: 0.75 };
    }
  } catch (err) {
    console.warn('[Suggest Urgency] AI fallback triggered:', err.message);
  }

  // Safe keyword fallback
  const lower = clinicalReason.toLowerCase();
  if (
    lower.includes('cardiac') || lower.includes('arrest') || lower.includes('stemi') ||
    lower.includes('unconscious') || lower.includes('hypoxia') || lower.includes('intubat') ||
    lower.includes('shock') || lower.includes('hemorrhage') || lower.includes('stat')
  ) {
    return { aiSuggestedPriority: 'Critical', confidence: 0.92 };
  }

  if (
    lower.includes('urgent') || lower.includes('sepsis') || lower.includes('deteriorat') ||
    lower.includes('severe') || lower.includes('tachy')
  ) {
    return { aiSuggestedPriority: 'High', confidence: 0.85 };
  }

  if (lower.includes('post-op') || lower.includes('transfer') || lower.includes('fever')) {
    return { aiSuggestedPriority: 'Moderate', confidence: 0.78 };
  }

  return { aiSuggestedPriority: 'Low', confidence: 0.70 };
}
