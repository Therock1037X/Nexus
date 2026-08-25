/**
 * AI Feature 1: Explain Audit Trail Assistant
 * Converts a sequence of raw Firestore events into a clean, human-readable narrative.
 */

import { generateContentWithFallback } from './llmClient.js';

export async function explainAuditTrail(events = [], apiKey = '') {
  if (!events || events.length === 0) {
    return 'No events found in this audit sequence.';
  }

  const prompt = `You are a Chief Medical Information Officer (CMIO) and Clinical Systems Auditor.
Summarize the following chronological sequence of hospital resource transaction events into a concise, factual, plain-English operational narrative (2-4 sentences).

Rules:
- State what resource was involved, who initiated the action, and the outcome.
- Explicitly mention any conflicts, priority escalations, or saga compensations/rollbacks that occurred and why.
- Do NOT hallucinate names or timestamps that are not present in the log.
- Keep the tone professional, objective, and auditable.

Raw Events:
${JSON.stringify(events, null, 2)}

Provide your executive operational summary:`;

  const fallbackSummary = () => {
    const resourceIds = [...new Set(events.map(e => e.resourceId).filter(Boolean))].join(', ');
    const actors = [...new Set(events.map(e => e.actorName).filter(Boolean))].join(' and ');
    const hasPreemption = events.some(e => e.type === 'escalation_preemption' || e.payload?.wasPreemption);
    const hasCompensation = events.some(e => e.type === 'saga_compensate' || e.type === 'conflict_rejected');
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    if (hasCompensation) {
      return `Audit Trace for [${resourceIds}]: An initial action initiated by ${actors || 'clinical staff'} encountered a conflict or cancellation condition. The system executed an atomic compensation rollback, restoring resource inventory and state to guarantee transactional consistency.`;
    }
    if (hasPreemption) {
      return `Audit Trace for [${resourceIds}]: Resource was initially held, but an incoming emergency escalation with higher priority triggered a deterministic preemption. The resource was reassigned to the critical patient and prior reservations were automatically notified.`;
    }
    return `Audit Trace for [${resourceIds}]: Successfully coordinated ${events.length} transactional steps between ${actors || 'medical team'}, updating resource status from initial state to current version ${lastEvent?.resultingVersion || 1} without concurrency conflicts.`;
  };

  return await generateContentWithFallback(prompt, { apiKey, model: 'gemini-2.5-flash' }, fallbackSummary);
}
