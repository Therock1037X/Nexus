/**
 * In-Browser Demo Hospital Seeder (Web SDK)
 * Allows 1-Click Initialization/Reset directly from the web interface.
 */

import {
  db,
  doc,
  collection,
  setDoc,
  DEFAULT_HOSPITAL_ID
} from '../firebase/firestore.js';

export const SEED_DATA = {
  floors: [
    { id: 'ground', name: 'Ground Floor — Emergency & OPD', level: 0, code: 'G' },
    { id: 'floor-1', name: 'Floor 1 — General Wards', level: 1, code: 'F1' },
    { id: 'floor-2', name: 'Floor 2 — ICU & Critical Care', level: 2, code: 'F2' },
    { id: 'floor-3', name: 'Floor 3 — Operation Theatres', level: 3, code: 'F3' }
  ],

  doctors: [
    { id: 'doc-1', name: 'Dr. Ananya Sharma', specialty: 'Cardiology', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-1' },
    { id: 'doc-2', name: 'Dr. Rohan Deshmukh', specialty: 'Orthopedics', role: 'doctor', status: 'on_round', shift: 'day', authUid: 'demo-doc-2' },
    { id: 'doc-3', name: 'Dr. Priya Nair', specialty: 'General Medicine', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-3' },
    { id: 'doc-4', name: 'Dr. Vikram Rao', specialty: 'Emergency Medicine', role: 'doctor', status: 'available', shift: 'night', authUid: 'demo-doc-4' },
    { id: 'doc-5', name: 'Dr. Kavita Joshi', specialty: 'Pediatrics', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-5' },
    { id: 'doc-6', name: 'Dr. Arjun Mehta', specialty: 'General Surgery', role: 'doctor', status: 'in_surgery', shift: 'day', authUid: 'demo-doc-6' },
    { id: 'doc-7', name: 'Dr. Sneha Kulkarni', specialty: 'ICU / Critical Care', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-7' },
    { id: 'doc-8', name: 'Dr. Aditya Verma', specialty: 'Anesthesiology', role: 'doctor', status: 'in_surgery', shift: 'day', authUid: 'demo-doc-8' },
    { id: 'doc-9', name: 'Dr. Meera Iyer', specialty: 'Gynecology', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-9' },
    { id: 'doc-10', name: 'Dr. Rahul Patil', specialty: 'Radiology', role: 'doctor', status: 'available', shift: 'day', authUid: 'demo-doc-10' }
  ],

  nurses: [
    { id: 'nurse-1', name: 'Nurse Pooja Pawar', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'demo-nurse-1' },
    { id: 'nurse-2', name: 'Nurse Sanjana Reddy', wardAssigned: 'ICU Floor 2', floorId: 'floor-2', role: 'nurse', status: 'busy', authUid: 'demo-nurse-2' },
    { id: 'nurse-3', name: 'Nurse Rina Fernandes', wardAssigned: 'Emergency Ground Floor', floorId: 'ground', role: 'nurse', status: 'available', authUid: 'demo-nurse-3' },
    { id: 'nurse-4', name: 'Nurse Deepa Kurien', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'demo-nurse-4' },
    { id: 'nurse-5', name: 'Nurse Amit Shinde', wardAssigned: 'ICU Floor 2', floorId: 'floor-2', role: 'nurse', status: 'busy', authUid: 'demo-nurse-5' },
    { id: 'nurse-6', name: 'Nurse Mary Thomas', wardAssigned: 'OT Floor 3', floorId: 'floor-3', role: 'nurse', status: 'busy', authUid: 'demo-nurse-6' },
    { id: 'nurse-7', name: 'Nurse Kavita Deshmukh', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'demo-nurse-7' },
    { id: 'nurse-8', name: 'Nurse Suresh Nair', wardAssigned: 'Emergency Ground Floor', floorId: 'ground', role: 'nurse', status: 'available', authUid: 'demo-nurse-8' }
  ],

  staffOther: [
    { id: 'pharm-1', name: 'Pharmacist Amit Chawla', department: 'Central Pharmacy', role: 'pharmacy', status: 'available', shift: 'day', authUid: 'demo-pharm-1' },
    { id: 'admin-1', name: 'Hospital Admin Vinit', department: 'Operations Center', role: 'admin', status: 'active', shift: 'all', authUid: 'demo-admin-1' }
  ],

  medicines: [
    { id: 'med-paracetamol', name: 'Paracetamol 500mg', type: 'medicine', category: 'Analgesic', quantity: 500, unit: 'tablets', version: 1, minThreshold: 50 },
    { id: 'med-amoxicillin', name: 'Amoxicillin 250mg', type: 'medicine', category: 'Antibiotic', quantity: 200, unit: 'capsules', version: 1, minThreshold: 40 },
    { id: 'med-insulin', name: 'Insulin (Rapid-acting)', type: 'medicine', category: 'Endocrine', quantity: 50, unit: 'vials', version: 1, minThreshold: 15 },
    { id: 'med-atorvastatin', name: 'Atorvastatin 20mg', type: 'medicine', category: 'Cardiovascular', quantity: 150, unit: 'tablets', version: 1, minThreshold: 30 },
    { id: 'med-omeprazole', name: 'Omeprazole 20mg', type: 'medicine', category: 'Gastrointestinal', quantity: 300, unit: 'capsules', version: 1, minThreshold: 50 },
    { id: 'med-salbutamol', name: 'Salbutamol Inhaler', type: 'medicine', category: 'Respiratory', quantity: 40, unit: 'inhalers', version: 1, minThreshold: 10 },
    { id: 'med-saline', name: 'Normal Saline IV (500ml)', type: 'medicine', category: 'IV Fluids', quantity: 100, unit: 'bottles', version: 1, minThreshold: 25 },
    { id: 'med-adrenaline', name: 'Adrenaline Injection (1mg/ml)', type: 'medicine', category: 'Emergency / Cardiac', quantity: 30, unit: 'ampoules', version: 1, minThreshold: 10, isScarce: true }
  ],

  theatres: [
    { id: 'OT-1', name: 'OT-1 (General Surgery)', type: 'ot', floorId: 'floor-3', otType: 'General Surgery', status: 'free', version: 1 },
    { id: 'OT-2', name: 'OT-2 (Cardiac Surgery)', type: 'ot', floorId: 'floor-3', otType: 'Cardiac Surgery', status: 'in_use', version: 1, currentProcedure: { patientName: 'Rajesh Verma', surgeon: 'Dr. Arjun Mehta' } },
    { id: 'OT-3', name: 'OT-3 (Orthopedic)', type: 'ot', floorId: 'floor-3', otType: 'Orthopedic Surgery', status: 'cleaning', version: 1 }
  ],

  equipment: [
    { id: 'EQ-XRAY-01', name: 'Digital X-Ray Machine', type: 'equipment', equipmentType: 'X-Ray', floorId: 'ground', roomNo: 'RAD-01', status: 'free', version: 1 },
    { id: 'EQ-MRI-01', name: '3.0T MRI Scanner', type: 'equipment', equipmentType: 'MRI', floorId: 'floor-1', roomNo: 'RAD-102', status: 'in_use', version: 1 },
    { id: 'EQ-CT-01', name: '128-Slice CT Scanner', type: 'equipment', equipmentType: 'CT', floorId: 'floor-1', roomNo: 'RAD-101', status: 'free', version: 1 },
    { id: 'EQ-VENT-01', name: 'ICU Ventilator Alpha', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU-201', status: 'in_use', version: 1 },
    { id: 'EQ-VENT-02', name: 'ICU Ventilator Beta', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU-202', status: 'in_use', version: 1 },
    { id: 'EQ-VENT-03', name: 'ICU Ventilator Gamma', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU Storage', status: 'free', version: 1, isScarce: true },
    { id: 'EQ-VENT-04', name: 'ICU Ventilator Delta', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU Storage', status: 'free', version: 1, isScarce: true }
  ],

  patients: [
    {
      patientId: 'pat-1',
      name: 'Ramesh Gupta',
      age: 54,
      gender: 'Male',
      phone: '+91 98201 44521',
      diagnosis: 'Bacterial Pneumonia with Mild Hypoxemia',
      currentBedId: 'G-101',
      assignedDoctorId: 'doc-3',
      assignedDoctorName: 'Dr. Priya Nair',
      status: 'admitted',
      admittedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      vitals: { hr: 82, bp: '124/80', spo2: 96, temp: '99.1 F' },
      documents: [
        { id: 'doc-101', name: 'Chest_XRay_PA_View.pdf', type: 'application/pdf', size: '2.4 MB', uploadedAt: new Date(Date.now() - 22 * 3600000).toISOString(), uploadedBy: 'Radiology Dept', notes: 'Right lower lobe consolidation noted.' },
        { id: 'doc-102', name: 'CBC_Blood_Panel.pdf', type: 'application/pdf', size: '1.1 MB', uploadedAt: new Date(Date.now() - 20 * 3600000).toISOString(), uploadedBy: 'Central Lab', notes: 'Elevated WBC count (14,200/mcL).' }
      ]
    },
    {
      patientId: 'pat-2',
      name: 'Sunita Devi',
      age: 62,
      gender: 'Female',
      phone: '+91 98190 88231',
      diagnosis: 'Acute Respiratory Distress Syndrome (ARDS)',
      currentBedId: 'ICU-201',
      assignedDoctorId: 'doc-7',
      assignedDoctorName: 'Dr. Sneha Kulkarni',
      status: 'critical',
      admittedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
      vitals: { hr: 110, bp: '95/60', spo2: 91, temp: '101.4 F' },
      documents: [
        { id: 'doc-201', name: 'Arterial_Blood_Gas_ABG.pdf', type: 'application/pdf', size: '850 KB', uploadedAt: new Date(Date.now() - 16 * 3600000).toISOString(), uploadedBy: 'ICU Lab Tech', notes: 'PaO2/FiO2 ratio: 180 mmHg (Moderate ARDS).' },
        { id: 'doc-202', name: 'HRCT_Thorax_Scan.pdf', type: 'application/pdf', size: '4.2 MB', uploadedAt: new Date(Date.now() - 14 * 3600000).toISOString(), uploadedBy: 'Radiology Dept', notes: 'Bilateral ground-glass opacities.' }
      ]
    },
    {
      patientId: 'pat-3',
      name: 'Rajesh Verma',
      age: 48,
      gender: 'Male',
      phone: '+91 97690 11982',
      diagnosis: 'Acute Coronary Syndrome / Post-MI',
      currentBedId: 'ICU-202',
      assignedDoctorId: 'doc-1',
      assignedDoctorName: 'Dr. Ananya Sharma',
      status: 'critical',
      admittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      vitals: { hr: 98, bp: '140/92', spo2: 95, temp: '98.6 F' },
      documents: [
        { id: 'doc-301', name: '12_Lead_ECG_Report.pdf', type: 'application/pdf', size: '1.6 MB', uploadedAt: new Date(Date.now() - 5 * 3600000).toISOString(), uploadedBy: 'Emergency Triage', notes: 'ST-segment elevation in leads V1-V4.' },
        { id: 'doc-302', name: 'Cardiac_Enzymes_TroponinI.pdf', type: 'application/pdf', size: '640 KB', uploadedAt: new Date(Date.now() - 4 * 3600000).toISOString(), uploadedBy: 'Biochemistry Lab', notes: 'High-sensitivity Troponin-I: 1.84 ng/mL.' }
      ]
    },
    {
      patientId: 'pat-4',
      name: 'Meenakshi Sundaram',
      age: 39,
      gender: 'Female',
      phone: '+91 99204 77123',
      diagnosis: 'Multiple Contusions & Observation',
      currentBedId: 'E-01',
      assignedDoctorId: 'doc-4',
      assignedDoctorName: 'Dr. Vikram Rao',
      status: 'emergency',
      admittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      vitals: { hr: 76, bp: '118/74', spo2: 99, temp: '98.4 F' },
      documents: [
        { id: 'doc-401', name: 'Whole_Body_Trauma_CT.pdf', type: 'application/pdf', size: '3.8 MB', uploadedAt: new Date(Date.now() - 90 * 60000).toISOString(), uploadedBy: 'Trauma Team', notes: 'No intracranial hemorrhage or visceral injury.' }
      ]
    },
    {
      patientId: 'pat-5',
      name: 'Arvind Patel',
      age: 67,
      gender: 'Male',
      phone: '+91 98450 33219',
      diagnosis: 'Right Femur Fracture Post-Fixation',
      currentBedId: 'G-105',
      assignedDoctorId: 'doc-2',
      assignedDoctorName: 'Dr. Rohan Deshmukh',
      status: 'admitted',
      admittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      vitals: { hr: 74, bp: '130/84', spo2: 98, temp: '98.8 F' },
      documents: [
        { id: 'doc-501', name: 'PostOp_Orthopedic_XRay.pdf', type: 'application/pdf', size: '2.1 MB', uploadedAt: new Date(Date.now() - 8 * 3600000).toISOString(), uploadedBy: 'Orthopedic Ward', notes: 'Intramedullary nail in anatomical alignment.' }
      ]
    },
    {
      patientId: 'pat-6',
      name: 'Fatima Khan',
      age: 45,
      gender: 'Female',
      phone: '+91 98330 66541',
      diagnosis: 'Post-Cholecystectomy Sepsis Monitoring',
      currentBedId: 'ICU-203',
      assignedDoctorId: 'doc-6',
      assignedDoctorName: 'Dr. Arjun Mehta',
      status: 'critical',
      admittedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      vitals: { hr: 104, bp: '100/68', spo2: 94, temp: '100.2 F' },
      documents: [
        { id: 'doc-601', name: 'Blood_Culture_Sensitivity.pdf', type: 'application/pdf', size: '1.2 MB', uploadedAt: new Date(Date.now() - 12 * 3600000).toISOString(), uploadedBy: 'Microbiology', notes: 'Gram-negative bacillus isolated; sensitive to Meropenem.' }
      ]
    }
  ]
};

// Generate 38 Beds
export function generateDemoBeds() {
  const beds = [];

  // Ground: 10 Emergency Beds
  for (let i = 1; i <= 10; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const id = `E-${num}`;
    const isOcc = i === 1 || i === 4;
    beds.push({
      id,
      name: `Emergency Bed ${id}`,
      type: 'bed',
      bedType: 'emergency',
      floorId: 'ground',
      roomNo: `ER Bay ${Math.ceil(i / 2)}`,
      status: isOcc ? 'occupied' : (i === 8 ? 'reserved' : 'free'),
      version: 1,
      currentAllocation: isOcc ? {
        patientId: i === 1 ? 'pat-4' : 'pat-temp-er',
        patientName: i === 1 ? 'Meenakshi Sundaram' : 'Walk-in Trauma Patient',
        assignedDoctorId: 'doc-4',
        assignedDoctorName: 'Dr. Vikram Rao',
        priority: 'urgent',
        allocatedAt: new Date(Date.now() - 2 * 3600000).toISOString()
      } : null
    });
  }

  // Floor 1: 20 General Beds
  const occupiedGen = [101, 105, 108, 112, 115, 118];
  for (let i = 101; i <= 120; i++) {
    const id = `G-${i}`;
    const isOcc = occupiedGen.includes(i);
    let alloc = null;
    if (i === 101) alloc = { patientId: 'pat-1', patientName: 'Ramesh Gupta', assignedDoctorId: 'doc-3', assignedDoctorName: 'Dr. Priya Nair', priority: 'normal', allocatedAt: new Date(Date.now() - 24 * 3600000).toISOString() };
    else if (i === 105) alloc = { patientId: 'pat-5', patientName: 'Arvind Patel', assignedDoctorId: 'doc-2', assignedDoctorName: 'Dr. Rohan Deshmukh', priority: 'normal', allocatedAt: new Date(Date.now() - 12 * 3600000).toISOString() };
    else if (isOcc) alloc = { patientId: `pat-${i}`, patientName: `Patient Gen-${i}`, assignedDoctorId: 'doc-3', assignedDoctorName: 'Dr. Priya Nair', priority: 'normal', allocatedAt: new Date(Date.now() - 8 * 3600000).toISOString() };

    beds.push({
      id,
      name: `General Bed ${id}`,
      type: 'bed',
      bedType: 'general',
      floorId: 'floor-1',
      roomNo: `Room ${Math.floor((i - 100) / 4) + 101}`,
      status: isOcc ? 'occupied' : (i === 102 ? 'cleaning' : 'free'),
      version: 1,
      currentAllocation: alloc
    });
  }

  // Floor 2: 8 ICU Beds (Scarce! 6 Occupied, 2 Free)
  const occupiedICU = [201, 202, 203, 204, 205, 206];
  for (let i = 201; i <= 208; i++) {
    const id = `ICU-${i}`;
    const isOcc = occupiedICU.includes(i);
    let alloc = null;
    if (i === 201) alloc = { patientId: 'pat-2', patientName: 'Sunita Devi', assignedDoctorId: 'doc-7', assignedDoctorName: 'Dr. Sneha Kulkarni', priority: 'critical', allocatedAt: new Date(Date.now() - 18 * 3600000).toISOString() };
    else if (i === 202) alloc = { patientId: 'pat-3', patientName: 'Rajesh Verma', assignedDoctorId: 'doc-1', assignedDoctorName: 'Dr. Ananya Sharma', priority: 'critical', allocatedAt: new Date(Date.now() - 6 * 3600000).toISOString() };
    else if (i === 203) alloc = { patientId: 'pat-6', patientName: 'Fatima Khan', assignedDoctorId: 'doc-6', assignedDoctorName: 'Dr. Arjun Mehta', priority: 'critical', allocatedAt: new Date(Date.now() - 36 * 3600000).toISOString() };
    else if (isOcc) alloc = { patientId: `pat-icu-${i}`, patientName: `Critical Patient ICU-${i}`, assignedDoctorId: 'doc-7', assignedDoctorName: 'Dr. Sneha Kulkarni', priority: 'high', allocatedAt: new Date(Date.now() - 14 * 3600000).toISOString() };

    beds.push({
      id,
      name: `ICU Bed ${id}`,
      type: 'bed',
      bedType: 'icu',
      floorId: 'floor-2',
      roomNo: `ICU Pod ${i - 200}`,
      status: isOcc ? 'occupied' : 'free',
      version: 1,
      isScarce: true,
      currentAllocation: alloc
    });
  }

  return beds;
}

export const INITIAL_SAGAS = [
  {
    id: 'saga-demo-rx-101',
    type: 'prescription',
    patientId: 'pat-1',
    patientName: 'Ramesh Gupta',
    medicineId: 'med-amoxicillin',
    medicineName: 'Amoxicillin 250mg',
    dosage: '1 capsule TDS',
    quantity: 15,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    steps: [
      { stepName: 'order', label: 'Doctor Prescription Order', status: 'done', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), actorId: 'doc-3', actorName: 'Dr. Priya Nair', actorRole: 'doctor', details: 'Prescribed 15 capsules of Amoxicillin 250mg' },
      { stepName: 'dispense', label: 'Pharmacy Stock Dispense', status: 'done', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), actorId: 'pharm-1', actorName: 'Pharmacist Amit Chawla', actorRole: 'pharmacy', details: 'Dispensed to General Ward Floor 1' },
      { stepName: 'administer', label: 'Bedside Nurse Administration', status: 'pending', timestamp: null, actorId: null, actorName: null, actorRole: 'nurse', details: 'Awaiting bedside administration & vitals check' }
    ]
  },
  {
    id: 'saga-demo-rx-102',
    type: 'prescription',
    patientId: 'pat-2',
    patientName: 'Sunita Devi',
    medicineId: 'med-salbutamol',
    medicineName: 'Salbutamol Inhaler',
    dosage: '2 puffs stat via nebulizer',
    quantity: 1,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    steps: [
      { stepName: 'order', label: 'Doctor Prescription Order', status: 'done', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), actorId: 'doc-7', actorName: 'Dr. Sneha Kulkarni', actorRole: 'doctor', details: 'Emergency bronchodilator prescription' },
      { stepName: 'dispense', label: 'Pharmacy Stock Dispense', status: 'pending', timestamp: null, actorId: null, actorName: null, actorRole: 'pharmacy', details: 'Queued in Central Pharmacy' },
      { stepName: 'administer', label: 'Bedside Nurse Administration', status: 'pending', timestamp: null, actorId: null, actorName: null, actorRole: 'nurse', details: 'Awaiting pharmacy dispense' }
    ]
  }
];

export async function seedDemoHospital(hospitalId = DEFAULT_HOSPITAL_ID) {
  const beds = generateDemoBeds();
  const allResources = [
    ...beds,
    ...SEED_DATA.theatres,
    ...SEED_DATA.medicines,
    ...SEED_DATA.equipment
  ];
  const allStaff = [
    ...SEED_DATA.doctors,
    ...SEED_DATA.nurses,
    ...SEED_DATA.staffOther
  ];

  // Save into LocalStore for instant fallback reactivity
  localStorage.setItem('nexus_local_resources', JSON.stringify(allResources));
  localStorage.setItem('nexus_local_staff', JSON.stringify(allStaff));
  localStorage.setItem('nexus_local_patients', JSON.stringify(SEED_DATA.patients));
  localStorage.setItem('nexus_local_floors', JSON.stringify(SEED_DATA.floors));
  localStorage.setItem('nexus_local_sagas', JSON.stringify(INITIAL_SAGAS));

  const initEvent = {
    id: `evt-init-${Date.now()}`,
    type: 'status_change',
    resourceId: 'SYSTEM_REGISTRY',
    actorId: 'admin-1',
    actorRole: 'admin',
    actorName: 'Hospital Admin Vinit',
    timestamp: new Date().toISOString(),
    idempotencyKey: `idemp-seed-${Date.now()}`,
    resultingVersion: 1,
    payload: {
      action: 'SYSTEM_INITIALIZATION',
      description: 'Hospital registry populated with 4 floors, 38 beds, 3 OTs, staff, equipment, and pharmacy inventory.',
      floorsCount: SEED_DATA.floors.length,
      resourcesCount: allResources.length,
      staffCount: allStaff.length
    }
  };
  localStorage.setItem('nexus_local_events', JSON.stringify([initEvent]));

  // Attempt Firestore Write
  try {
    const hospitalRef = doc(db, 'hospitals', hospitalId);
    await setDoc(hospitalRef, {
      hospitalId,
      name: 'Apex City Hospital & Research Center',
      tagline: 'Level 1 Trauma & Multi-Specialty Tertiary Care Center',
      totalBeds: 38,
      operatingTheatres: 3,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // Seed subcollections asynchronously
    for (const fl of SEED_DATA.floors) {
      await setDoc(doc(db, 'hospitals', hospitalId, 'floors', fl.id), fl, { merge: true }).catch(() => {});
    }
    for (const res of allResources) {
      await setDoc(doc(db, 'hospitals', hospitalId, 'resources', res.id), res, { merge: true }).catch(() => {});
    }
    for (const staff of allStaff) {
      await setDoc(doc(db, 'hospitals', hospitalId, 'staff', staff.id), staff, { merge: true }).catch(() => {});
    }
    for (const pat of SEED_DATA.patients) {
      await setDoc(doc(db, 'hospitals', hospitalId, 'patients', pat.patientId), pat, { merge: true }).catch(() => {});
    }
    for (const saga of INITIAL_SAGAS) {
      await setDoc(doc(db, 'hospitals', hospitalId, 'sagas', saga.id), saga, { merge: true }).catch(() => {});
    }
    await setDoc(doc(db, 'hospitals', hospitalId, 'events', initEvent.id), initEvent, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('[SEED] Local store populated; Firestore write skipped/delayed:', err.message);
  }

  window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'all' } }));
  return {
    success: true,
    totalResources: allResources.length,
    totalBeds: beds.length,
    totalStaff: allStaff.length
  };
}
