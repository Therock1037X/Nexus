/**
 * Transaction: Escalate Resource Priority / Override
 * Applies emergency preemption if target resource is held by lower priority reservation.
 */

import { checkIdempotency } from '../utils/idempotency.js';
import { executeAllocateResource } from './allocateResource.js';

export async function executeEscalateResource(db, hospitalId, params) {
  const {
    resourceId,
    actorId,
    actorName,
    actorRole = 'doctor',
    patientId,
    patientName,
    escalationLevel = 'critical', // 'critical' | 'urgent'
    clinicalReason = 'Emergency acute condition escalation',
    idempotencyKey,
    aiSuggestedPriority = null
  } = params;

  return await executeAllocateResource(db, hospitalId, {
    resourceId,
    actorId,
    actorName,
    actorRole,
    patientId,
    patientName,
    allocationType: 'occupied',
    priority: escalationLevel,
    reason: `[ESCALATION OVERRIDE] ${clinicalReason}`,
    idempotencyKey: idempotencyKey || `esc-${Date.now()}`,
    aiSuggestedPriority
  });
}
