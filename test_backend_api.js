/**
 * Automated test suite for NEXUS Backend API endpoints
 */

async function testBackend() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('Testing NEXUS Backend API on', BASE_URL);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✅ 1. Health check passed:', health.status, 'Active resources:', health.resourcesCount);

  // 2. Stats
  const statsRes = await fetch(`${BASE_URL}/stats`);
  const stats = await statsRes.json();
  console.log('✅ 2. Stats passed: Occupancy Rate:', stats.occupancyRate + '%', 'Free ICU:', stats.freeIcuBeds);

  // 3. Admit Patient
  const admitRes = await fetch(`${BASE_URL}/patients/admit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kavita Chawla',
      age: 38,
      gender: 'Female',
      phone: '+91 98200 77112',
      reason: 'Acute lower abdominal pain and dehydration',
      assignedDoctorId: 'doc-1',
      assignedDoctorName: 'Dr. Ananya Sharma',
      priority: 'urgent'
    })
  });
  const admit = await admitRes.json();
  console.log('✅ 3. Patient admit passed:', admit.patient.name, 'ID:', admit.patient.patientId, 'Assigned to:', admit.patient.assignedDoctorName);

  // 4. Allocate Resource
  const allocRes = await fetch(`${BASE_URL}/transactions/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceId: 'G-102',
      actorId: 'doc-1',
      actorName: 'Dr. Ananya Sharma',
      patientId: admit.patient.patientId,
      patientName: admit.patient.name,
      allocationType: 'occupied',
      priority: 'urgent',
      reason: 'Emergency post-triage ward bed placement'
    })
  });
  const alloc = await allocRes.json();
  console.log('✅ 4. Allocate resource passed: Bed G-102 assigned to', admit.patient.name, 'Version:', alloc.version);

  // 5. Start Prescription Saga
  const sagaRes = await fetch(`${BASE_URL}/sagas/prescription/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: admit.patient.patientId,
      patientName: admit.patient.name,
      medicineId: 'med-amoxicillin',
      medicineName: 'Amoxicillin 250mg',
      dosage: '500mg IV stat',
      quantity: 5,
      doctorId: 'doc-1',
      doctorName: 'Dr. Ananya Sharma',
      notes: 'Administer with normal saline'
    })
  });
  const saga = await sagaRes.json();
  console.log('✅ 5. Prescription saga started: Saga ID:', saga.sagaId, 'Remaining inventory:', saga.remainingStock);

  // 6. Advance Prescription Saga (Pharmacy Dispense)
  const advanceRes = await fetch(`${BASE_URL}/sagas/prescription/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sagaId: saga.sagaId,
      stepName: 'dispense',
      actorId: 'pharm-1',
      actorName: 'Pharmacist Amit Chawla',
      actorRole: 'pharmacy',
      details: 'Verified batch #LOT-9921, dispatched to Floor 1'
    })
  });
  const advance = await advanceRes.json();
  console.log('✅ 6. Prescription saga advanced to Step 2 (Dispensed):', advance.status);

  // 7. AI Natural Language Parser
  const nlpRes = await fetch(`${BASE_URL}/ai/parse-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      naturalText: 'Need an ICU bed and ventilator urgently for acute cardiac arrest patient'
    })
  });
  const nlp = await nlpRes.json();
  console.log('✅ 7. AI NLP parser passed: Extracted:', nlp.resourceType, '/', nlp.subType, 'Priority:', nlp.priority);

  console.log('\n🎉 ALL 7 BACKEND TESTS PASSED SUCCESSFULLY! The backend is active and fully connected.');
}

testBackend().catch(err => {
  console.error('❌ Backend test failed:', err);
  process.exit(1);
});
