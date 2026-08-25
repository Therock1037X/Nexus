/**
 * Deterministic Conflict Resolution Engine
 * 
 * Rules:
 * 1. Escalation Priority Tier: CRITICAL (4) > URGENT (3) > HIGH (2) > NORMAL (1) > LOW (0)
 * 2. Preemption: Higher priority overrides and reallocates an existing reservation.
 * 3. Tiebreaker: When priority tiers are identical, earlier server timestamp wins.
 * 4. Zero Silent Failures: Losing requests receive an explicit rejection reason logged to the audit stream.
 */

export const PRIORITY_TIERS = {
  critical: 4,
  urgent: 3,
  high: 2,
  normal: 1,
  low: 0
};

/**
 * Normalizes priority string to numeric weight
 * @param {string} priority 
 * @returns {number}
 */
export function getPriorityScore(priority) {
  if (!priority) return PRIORITY_TIERS.normal;
  const key = String(priority).toLowerCase().trim();
  return PRIORITY_TIERS[key] !== undefined ? PRIORITY_TIERS[key] : PRIORITY_TIERS.normal;
}

/**
 * Evaluates whether a new resource request can acquire or preempt a resource.
 * 
 * @param {object} currentResource - Current Firestore document data
 * @param {object} newRequest - Incoming request payload
 * @returns {{
 *   canProceed: boolean,
 *   isPreemption: boolean,
 *   reason: string,
 *   preemptedAllocation: object|null
 * }}
 */
export function evaluateResourceConflict(currentResource, newRequest) {
  const currentStatus = currentResource.status || 'free';
  const currentAllocation = currentResource.currentAllocation || null;
  const newPriority = newRequest.priority || 'normal';
  const newScore = getPriorityScore(newPriority);

  // Case 1: Resource is freely available
  if (currentStatus === 'free') {
    return {
      canProceed: true,
      isPreemption: false,
      reason: 'Resource is available and unreserved.',
      preemptedAllocation: null
    };
  }

  // Case 2: Resource is undergoing maintenance or cleaning
  if (currentStatus === 'maintenance' || currentStatus === 'cleaning') {
    // Only Critical / Emergency escalations can override cleaning if authorized
    if (newScore >= PRIORITY_TIERS.critical && currentStatus === 'cleaning') {
      return {
        canProceed: true,
        isPreemption: true,
        reason: 'CRITICAL Emergency Escalation authorized expedited cleaning bypass.',
        preemptedAllocation: currentAllocation
      };
    }
    return {
      canProceed: false,
      isPreemption: false,
      reason: `Resource is currently unavailable due to ${currentStatus.toUpperCase()}.`,
      preemptedAllocation: null
    };
  }

  // Case 3: Resource is 'reserved' or 'occupied'
  if (currentStatus === 'reserved' || currentStatus === 'occupied' || currentStatus === 'in_use') {
    const existingPriority = currentAllocation?.priority || (currentStatus === 'occupied' ? 'high' : 'normal');
    const existingScore = getPriorityScore(existingPriority);

    // If new request is higher priority than existing hold -> PREEMPTION
    if (newScore > existingScore) {
      return {
        canProceed: true,
        isPreemption: true,
        reason: `Priority Escalation Preemption: Incoming ${newPriority.toUpperCase()} (tier ${newScore}) overrides existing ${existingPriority.toUpperCase()} (tier ${existingScore}).`,
        preemptedAllocation: currentAllocation
      };
    }

    // If new request is equal or lower priority -> DETERMINISTIC REJECTION
    const reason = newScore === existingScore
      ? `Deterministic Conflict: Resource is held by an existing reservation at the same priority level (${existingPriority}). First-come, first-served policy applies.`
      : `Deterministic Conflict: Incoming priority (${newPriority}) is lower than existing hold priority (${existingPriority}). Request rejected.`;

    return {
      canProceed: false,
      isPreemption: false,
      reason,
      preemptedAllocation: null
    };
  }

  return {
    canProceed: false,
    isPreemption: false,
    reason: `Unknown resource status: ${currentStatus}`,
    preemptedAllocation: null
  };
}
