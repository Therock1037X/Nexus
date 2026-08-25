import { explainActivityLogic } from './functions/src/ai/explainActivity.js';
import { suggestUrgencyLogic } from './functions/src/ai/suggestUrgency.js';
import { parseResourceRequestLogic } from './functions/src/ai/parseRequest.js';
import { predictAvailabilityLogic } from './functions/src/ai/predictAvailability.js';
import { getSuggestedActionLogic } from './functions/src/ai/suggestedAction.js';

console.log('Testing 5 Nexus AI Functions...\n');

async function runTests() {
  // Test 1: Explain Activity
  console.log('--- TEST 1: Explain Activity ---');
  const sampleEvents = [
    { type: 'allocate', resourceId: 'ICU-201', actorName: 'Dr. Ananya Sharma', payload: { action: 'Bed Assigned', patientName: 'Rajesh Verma', priority: 'critical' }, timestamp: new Date().toISOString() },
    { type: 'conflict_rejected', resourceId: 'ICU-201', actorName: 'Dr. Sneha Kulkarni', payload: { rejectionReason: 'Bed already occupied by critical patient Rajesh Verma' }, timestamp: new Date().toISOString() }
  ];
  const t1 = await explainActivityLogic({ events: sampleEvents });
  console.log('Output 1:', t1);

  // Test 2: Suggest Urgency
  console.log('\n--- TEST 2: Suggest Urgency ---');
  const t2a = await suggestUrgencyLogic({ reasonText: 'Patient in acute STEMI with refractory ventricular tachycardia stat' });
  const t2b = await suggestUrgencyLogic({ reasonText: 'Patient is stable, routine post-op recovery check' });
  console.log('Output 2a (Critical note):', t2a);
  console.log('Output 2b (Routine note):', t2b);

  // Test 3: Parse Natural Language Request
  console.log('\n--- TEST 3: Parse Natural Language Request ---');
  const t3 = await parseResourceRequestLogic({ requestText: 'Need an ICU bed and ventilator urgently for a 62yo female with severe ARDS' });
  console.log('Output 3:', t3);

  // Test 4: Predict Resource Availability
  console.log('\n--- TEST 4: Predict Resource Availability ---');
  const t4 = await predictAvailabilityLogic({
    resourceType: 'bed',
    resources: [{ type: 'bed', status: 'occupied' }, { type: 'bed', status: 'free' }],
    events: sampleEvents
  });
  console.log('Output 4:', t4);

  // Test 5: Suggested Next Action
  console.log('\n--- TEST 5: Suggested Next Action ---');
  const t5 = await getSuggestedActionLogic({
    doctorId: 'doc-1',
    doctorName: 'Dr. Ananya Sharma',
    patients: [{ patientId: 'pat-1', name: 'Ramesh Gupta', assignedDoctorId: 'doc-1', status: 'admitted' }],
    sagas: [{ patientId: 'pat-1', patientName: 'Ramesh Gupta', medicineName: 'Amoxicillin 250mg', status: 'in_progress', steps: [{ status: 'done' }, { status: 'done' }, { status: 'pending' }] }]
  });
  console.log('Output 5:', t5);

  console.log('\n✅ All 5 AI functions tested successfully!');
}

runTests().catch(console.error);
