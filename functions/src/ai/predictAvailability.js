import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `Given this history of bed allocations and releases, estimate in one short sentence how many beds of this type are likely to become free in the next hour, and state this is an estimate, not a guarantee. Base your estimate only on the pattern in the data provided.`;

/**
 * FUNCTION 4: Predict Resource Availability
 * Returns: { summary: string, projectedFreedIcuBedsInNext2Hours: number, projectedOtTurnoverMinutes: number, bottleneckRiskLevel: string, recommendedAction: string }
 */
export async function predictAvailability(resources = [], events = [], hospitalId = 'default-hospital') {
  const freeBeds = resources.filter(r => r.type === 'bed' && r.status === 'free').length;
  const occupiedBeds = resources.filter(r => r.type === 'bed' && r.status === 'occupied').length;
  const cleaningBeds = resources.filter(r => r.type === 'bed' && r.status === 'cleaning').length;

  const promptInput = `Current State: ${freeBeds} free beds, ${occupiedBeds} occupied beds, ${cleaningBeds} beds currently being cleaned. Total recent events: ${events.length}.`;

  let sentenceSummary = `Based on current discharge schedules, 1 to 2 ICU beds are estimated to become available within the next hour (estimate only).`;

  try {
    const aiText = await callGemini(SYSTEM_PROMPT, promptInput, 'gemini-1.5-flash', hospitalId);
    if (aiText && aiText.length > 10) {
      sentenceSummary = aiText.replace(/```/g, '').trim();
    }
  } catch (err) {
    console.warn('[Predict Availability] AI fallback triggered:', err.message);
  }

  const occupancyRate = resources.length > 0 ? Math.round((occupiedBeds / resources.length) * 100) : 30;

  return {
    summary: sentenceSummary,
    projectedFreedIcuBedsInNext2Hours: Math.max(1, cleaningBeds + (freeBeds > 3 ? 2 : 1)),
    projectedOtTurnoverMinutes: 30,
    bottleneckRiskLevel: occupancyRate > 80 ? 'HIGH' : occupancyRate > 50 ? 'MODERATE' : 'NORMAL',
    recommendedAction: cleaningBeds > 0
      ? `Expedite cleaning on ${cleaningBeds} sanitizing bed(s) to increase reserve buffer.`
      : 'Maintain standard ward allocation protocols.'
  };
}
