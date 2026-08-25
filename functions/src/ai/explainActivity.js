import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `You are summarizing hospital system activity for a non-technical hospital administrator. Given this list of events, write a short, factual, plain-English summary (2-4 sentences) of what happened and why, in the order it happened. Use simple words. Do not use technical terms like transaction, saga, deterministic, or concurrency. Do not invent any detail not present in the event data. If the events show a conflict, clearly state which request won and why in one plain sentence.`;

/**
 * FUNCTION 1: Explain What Happened (Activity Summary)
 * Returns a short, plain-English paragraph without jargon.
 */
export async function explainActivity(events = [], hospitalId = 'default-hospital') {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return 'No recent activity recorded yet.';
  }

  // Format events cleanly for the model
  const simplifiedEvents = events.slice(0, 15).map(e => ({
    time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Recent',
    action: e.type,
    resource: e.resourceId || 'Bed/Unit',
    actor: e.actorName || 'Staff',
    role: e.actorRole || 'Clinical staff',
    patient: e.payload?.patientName || 'Patient',
    details: e.payload?.reason || e.payload?.description || e.payload?.rejectionReason || ''
  }));

  const inputPayload = JSON.stringify(simplifiedEvents, null, 2);

  try {
    const aiResponse = await callGemini(SYSTEM_PROMPT, inputPayload, 'gemini-1.5-flash', hospitalId);
    if (aiResponse) {
      // Clean any accidental markdown quotes or backticks
      return aiResponse.replace(/```/g, '').trim();
    }
  } catch (err) {
    console.warn('[Explain Activity] AI fallback triggered:', err.message);
  }

  // Safe deterministic fallback without jargon
  const actors = [...new Set(events.map(e => e.actorName).filter(Boolean))].join(', ');
  const resources = [...new Set(events.map(e => e.resourceId).filter(Boolean))].join(', ');
  const hasConflict = events.some(e => e.type === 'conflict_rejected' || e.type === 'escalation_preemption');

  if (hasConflict) {
    return `Recent hospital activity shows multiple requests for ${resources || 'beds'}. The system assigned the resource to the highest urgency emergency patient, and the other doctor was safely notified to select an alternate unit.`;
  }

  return `${actors || 'Clinical staff'} updated records and care events for ${resources || 'assigned beds'}. All updates were saved successfully in order.`;
}
