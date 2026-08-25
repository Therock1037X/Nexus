/**
 * Automated Verification Script for NEXUS Transaction & Saga Engines
 */

import { evaluateResourceConflict, getPriorityScore, PRIORITY_TIERS } from './functions/src/utils/conflictResolution.js';

console.log('======================================================');
console.log('🧪 NEXUS TRANSACTION & SAGA ENGINE AUTOMATED TESTS');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// TEST 1: Priority Score Weights
console.log('[Test 1] Priority Scoring');
assert(getPriorityScore('critical') === 4, 'Critical priority has weight 4');
assert(getPriorityScore('urgent') === 3, 'Urgent priority has weight 3');
assert(getPriorityScore('high') === 2, 'High priority has weight 2');
assert(getPriorityScore('normal') === 1, 'Normal priority has weight 1');
assert(getPriorityScore('unknown') === 1, 'Unknown priority defaults to Normal (1)');

// TEST 2: Free Resource Allocation
console.log('\n[Test 2] Free Resource Allocation');
const freeBed = { id: 'ICU-201', status: 'free', version: 1 };
const resFree = evaluateResourceConflict(freeBed, { priority: 'normal' });
assert(resFree.canProceed === true, 'Free bed can be acquired without conflict');
assert(resFree.isPreemption === false, 'Free bed allocation is not a preemption');

// TEST 3: Equal Priority Conflict (Deterministic Rejection)
console.log('\n[Test 3] Equal Priority Conflict (Deterministic Rejection)');
const occupiedBed = {
  id: 'ICU-202',
  status: 'occupied',
  version: 2,
  currentAllocation: { patientId: 'pat-1', patientName: 'Patient A', priority: 'normal' }
};
const resEqual = evaluateResourceConflict(occupiedBed, { priority: 'normal' });
assert(resEqual.canProceed === false, 'Equal priority request is rejected deterministically');
assert(resEqual.reason.includes('Deterministic Conflict'), 'Rejection rationale is explicitly provided');

// TEST 4: Lower Priority Request against Higher Priority Hold
console.log('\n[Test 4] Lower Priority against Higher Hold');
const highHoldBed = {
  id: 'ICU-203',
  status: 'occupied',
  version: 2,
  currentAllocation: { patientId: 'pat-2', patientName: 'Patient B', priority: 'high' }
};
const resLower = evaluateResourceConflict(highHoldBed, { priority: 'normal' });
assert(resLower.canProceed === false, 'Lower priority request is rejected');

// TEST 5: Higher Priority Emergency Escalation Preemption
console.log('\n[Test 5] Emergency Preemption Override');
const normalHeldBed = {
  id: 'ICU-204',
  status: 'reserved',
  version: 1,
  currentAllocation: { patientId: 'pat-3', patientName: 'Patient C', priority: 'normal' }
};
const resPreempt = evaluateResourceConflict(normalHeldBed, { priority: 'critical', reason: 'Emergency cardiac arrest' });
assert(resPreempt.canProceed === true, 'Critical escalation can proceed');
assert(resPreempt.isPreemption === true, 'Flagged as priority preemption override');
assert(resPreempt.preemptedAllocation.patientName === 'Patient C', 'Identifies preempted patient for notification');

// TEST 6: Cleaning Bypass on Critical Escalation
console.log('\n[Test 6] Cleaning Bypass on Critical Escalation');
const cleaningBed = { id: 'G-102', status: 'cleaning', version: 1 };
const resCleanNormal = evaluateResourceConflict(cleaningBed, { priority: 'normal' });
assert(resCleanNormal.canProceed === false, 'Normal request cannot bypass cleaning');

const resCleanCritical = evaluateResourceConflict(cleaningBed, { priority: 'critical' });
assert(resCleanCritical.canProceed === true, 'Critical request can bypass cleaning with expedited protocol');

console.log('\n======================================================');
console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
