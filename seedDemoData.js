/**
 * NEXUS - Clinical Resource Transaction System
 * Demo Hospital Seeding Script (Firebase Admin SDK)
 * 
 * Usage:
 *   node seedDemoData.js [optional-path-to-service-account.json]
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Service Account Configuration
const SERVICE_ACCOUNT_PATH = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
const HOSPITAL_ID = 'demo-hospital-1';

// Initialize Firebase Admin
if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log(`[INIT] Firebase Admin initialized with service account: ${SERVICE_ACCOUNT_PATH}`);
} else {
  // Attempt default credentials or emulator
  admin.initializeApp();
  console.log(`[INIT] Firebase Admin initialized with Application Default Credentials or Emulator`);
}

const db = admin.firestore();

// 2. Hospital Master Structure Definition
const FLOORS = [
  { id: 'ground', name: 'Ground Floor — Emergency & OPD', level: 0, code: 'G' },
  { id: 'floor-1', name: 'Floor 1 — General Wards', level: 1, code: 'F1' },
  { id: 'floor-2', name: 'Floor 2 — ICU & Critical Care', level: 2, code: 'F2' },
  { id: 'floor-3', name: 'Floor 3 — Operation Theatres', level: 3, code: 'F3' }
];

const DOCTORS = [
  { id: 'doc-1', name: 'Dr. Ananya Sharma', specialty: 'Cardiology', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-1' },
  { id: 'doc-2', name: 'Dr. Rohan Deshmukh', specialty: 'Orthopedics', role: 'doctor', status: 'on_round', shift: 'day', authUid: 'auth-doc-2' },
  { id: 'doc-3', name: 'Dr. Priya Nair', specialty: 'General Medicine', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-3' },
  { id: 'doc-4', name: 'Dr. Vikram Rao', specialty: 'Emergency Medicine', role: 'doctor', status: 'available', shift: 'night', authUid: 'auth-doc-4' },
  { id: 'doc-5', name: 'Dr. Kavita Joshi', specialty: 'Pediatrics', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-5' },
  { id: 'doc-6', name: 'Dr. Arjun Mehta', specialty: 'General Surgery', role: 'doctor', status: 'in_surgery', shift: 'day', authUid: 'auth-doc-6' },
  { id: 'doc-7', name: 'Dr. Sneha Kulkarni', specialty: 'ICU/Critical Care', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-7' },
  { id: 'doc-8', name: 'Dr. Aditya Verma', specialty: 'Anesthesiology', role: 'doctor', status: 'in_surgery', shift: 'day', authUid: 'auth-doc-8' },
  { id: 'doc-9', name: 'Dr. Meera Iyer', specialty: 'Gynecology', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-9' },
  { id: 'doc-10', name: 'Dr. Rahul Patil', specialty: 'Radiology', role: 'doctor', status: 'available', shift: 'day', authUid: 'auth-doc-10' }
];

const NURSES = [
  { id: 'nurse-1', name: 'Nurse Pooja Pawar', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'auth-nurse-1' },
  { id: 'nurse-2', name: 'Nurse Sanjana Reddy', wardAssigned: 'ICU Floor 2', floorId: 'floor-2', role: 'nurse', status: 'busy', authUid: 'auth-nurse-2' },
  { id: 'nurse-3', name: 'Nurse Rina Fernandes', wardAssigned: 'Emergency Ground Floor', floorId: 'ground', role: 'nurse', status: 'available', authUid: 'auth-nurse-3' },
  { id: 'nurse-4', name: 'Nurse Deepa Kurien', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'auth-nurse-4' },
  { id: 'nurse-5', name: 'Nurse Amit Shinde', wardAssigned: 'ICU Floor 2', floorId: 'floor-2', role: 'nurse', status: 'busy', authUid: 'auth-nurse-5' },
  { id: 'nurse-6', name: 'Nurse Mary Thomas', wardAssigned: 'OT Floor 3', floorId: 'floor-3', role: 'nurse', status: 'busy', authUid: 'auth-nurse-6' },
  { id: 'nurse-7', name: 'Nurse Kavita Deshmukh', wardAssigned: 'General Floor 1', floorId: 'floor-1', role: 'nurse', status: 'available', authUid: 'auth-nurse-7' },
  { id: 'nurse-8', name: 'Nurse Suresh Nair', wardAssigned: 'Emergency Ground Floor', floorId: 'ground', role: 'nurse', status: 'available', authUid: 'auth-nurse-8' }
];

const OTHER_STAFF = [
  { id: 'pharm-1', name: 'Pharmacist Amit Chawla', department: 'Central Pharmacy', role: 'pharmacy', status: 'available', shift: 'day', authUid: 'auth-pharm-1' },
  { id: 'admin-1', name: 'Hospital Admin Vinit', department: 'Operations Command', role: 'admin', status: 'active', shift: 'all', authUid: 'auth-admin-1' }
];

const MEDICINES = [
  { id: 'med-paracetamol', name: 'Paracetamol 500mg', type: 'medicine', category: 'Analgesic', quantity: 500, unit: 'tablets', version: 1, minThreshold: 50 },
  { id: 'med-amoxicillin', name: 'Amoxicillin 250mg', type: 'medicine', category: 'Antibiotic', quantity: 200, unit: 'capsules', version: 1, minThreshold: 40 },
  { id: 'med-insulin', name: 'Insulin (Rapid-acting)', type: 'medicine', category: 'Endocrine', quantity: 50, unit: 'vials', version: 1, minThreshold: 15 },
  { id: 'med-atorvastatin', name: 'Atorvastatin 20mg', type: 'medicine', category: 'Cardiovascular', quantity: 150, unit: 'tablets', version: 1, minThreshold: 30 },
  { id: 'med-omeprazole', name: 'Omeprazole 20mg', type: 'medicine', category: 'Gastrointestinal', quantity: 300, unit: 'capsules', version: 1, minThreshold: 50 },
  { id: 'med-salbutamol', name: 'Salbutamol Inhaler', type: 'medicine', category: 'Respiratory', quantity: 40, unit: 'inhalers', version: 1, minThreshold: 10 },
  { id: 'med-saline', name: 'Normal Saline IV (500ml)', type: 'medicine', category: 'IV Fluids', quantity: 100, unit: 'bottles', version: 1, minThreshold: 25 },
  { id: 'med-adrenaline', name: 'Adrenaline Injection (1mg/ml)', type: 'medicine', category: 'Emergency / Cardiac', quantity: 30, unit: 'ampoules', version: 1, minThreshold: 10, isScarce: true }
];

const OPERATION_THEATRES = [
  { id: 'OT-1', name: 'OT-1 (General Surgery)', type: 'ot', floorId: 'floor-3', otType: 'General Surgery', status: 'free', version: 1, currentProcedure: null },
  { id: 'OT-2', name: 'OT-2 (Cardiac Surgery)', type: 'ot', floorId: 'floor-3', otType: 'Cardiac Surgery', status: 'in_use', version: 1, currentProcedure: { patientId: 'pat-3', doctorId: 'doc-1', surgeon: 'Dr. Arjun Mehta', startedAt: new Date(Date.now() - 45 * 60000).toISOString() } },
  { id: 'OT-3', name: 'OT-3 (Orthopedic Surgery)', type: 'ot', floorId: 'floor-3', otType: 'Orthopedic Surgery', status: 'cleaning', version: 1, currentProcedure: null }
];

const DIAGNOSTIC_EQUIPMENT = [
  { id: 'EQ-XRAY-01', name: 'Digital X-Ray Unit A', type: 'equipment', equipmentType: 'X-Ray', floorId: 'ground', roomNo: 'RAD-01', status: 'free', version: 1 },
  { id: 'EQ-MRI-01', name: '3.0T High-Field MRI Scanner', type: 'equipment', equipmentType: 'MRI', floorId: 'floor-1', roomNo: 'RAD-102', status: 'in_use', version: 1, inUseBy: 'pat-1' },
  { id: 'EQ-CT-01', name: '128-Slice CT Scanner', type: 'equipment', equipmentType: 'CT', floorId: 'floor-1', roomNo: 'RAD-101', status: 'free', version: 1 },
  { id: 'EQ-VENT-01', name: 'ICU Ventilator Alpha', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU-201', status: 'in_use', version: 1, inUseBy: 'pat-2' },
  { id: 'EQ-VENT-02', name: 'ICU Ventilator Beta', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU-202', status: 'in_use', version: 1, inUseBy: 'pat-3' },
  { id: 'EQ-VENT-03', name: 'ICU Ventilator Gamma', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU Storage', status: 'free', version: 1, isScarce: true },
  { id: 'EQ-VENT-04', name: 'ICU Ventilator Delta', type: 'equipment', equipmentType: 'Ventilator', floorId: 'floor-2', roomNo: 'ICU Storage', status: 'free', version: 1, isScarce: true }
];

// Generate Beds
function generateBeds() {
  const beds = [];

  // Ground Floor: 10 Emergency Beds (E-01 to E-10)
  for (let i = 1; i <= 10; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const id = `E-${num}`;
    const isOccupied = i === 1 || i === 4; // E-01 occupied by pat-4
    beds.push({
      id,
      name: `Emergency Bed ${id}`,
      type: 'bed',
      bedType: 'emergency',
      floorId: 'ground',
      roomNo: `ER-Bay-${Math.ceil(i / 2)}`,
      status: isOccupied ? 'occupied' : (i === 8 ? 'reserved' : 'free'),
      version: 1,
      currentAllocation: isOccupied ? {
        patientId: i === 1 ? 'pat-4' : 'pat-temp-er',
        patientName: i === 1 ? 'Meenakshi Sundaram' : 'Walk-in Trauma Patient',
        assignedDoctorId: 'doc-4',
        admittedAt: new Date(Date.now() - 2 * 3600000).toISOString()
      } : null
    });
  }

  // Floor 1: 20 General Ward Beds (G-101 to G-120)
  const occupiedGeneral = [101, 105, 108, 112, 115, 118];
  for (let i = 101; i <= 120; i++) {
    const id = `G-${i}`;
    const isOccupied = occupiedGeneral.includes(i);
    let patientData = null;
    if (i === 101) {
      patientData = { patientId: 'pat-1', patientName: 'Ramesh Gupta', assignedDoctorId: 'doc-3', admittedAt: new Date(Date.now() - 24 * 3600000).toISOString() };
    } else if (i === 105) {
      patientData = { patientId: 'pat-5', patientName: 'Arvind Patel', assignedDoctorId: 'doc-2', admittedAt: new Date(Date.now() - 12 * 3600000).toISOString() };
    } else if (isOccupied) {
      patientData = { patientId: `pat-gen-${i}`, patientName: `Patient Gen-${i}`, assignedDoctorId: 'doc-3', admittedAt: new Date(Date.now() - 8 * 3600000).toISOString() };
    }

    beds.push({
      id,
      name: `General Bed ${id}`,
      type: 'bed',
      bedType: 'general',
      floorId: 'floor-1',
      roomNo: `Room ${Math.floor((i - 100) / 4) + 101}`,
      status: isOccupied ? 'occupied' : (i === 102 ? 'cleaning' : 'free'),
      version: 1,
      currentAllocation: patientData
    });
  }

  // Floor 2: 8 ICU Beds (ICU-201 to ICU-208) - Scarce! 6 Occupied, 2 Free
  const occupiedICU = [201, 202, 203, 204, 205, 206];
  for (let i = 201; i <= 208; i++) {
    const id = `ICU-${i}`;
    const isOccupied = occupiedICU.includes(i);
    let patientData = null;
    if (i === 201) {
      patientData = { patientId: 'pat-2', patientName: 'Sunita Devi', assignedDoctorId: 'doc-7', admittedAt: new Date(Date.now() - 18 * 3600000).toISOString() };
    } else if (i === 202) {
      patientData = { patientId: 'pat-3', patientName: 'Rajesh Verma', assignedDoctorId: 'doc-1', admittedAt: new Date(Date.now() - 6 * 3600000).toISOString() };
    } else if (i === 203) {
      patientData = { patientId: 'pat-6', patientName: 'Fatima Khan', assignedDoctorId: 'doc-6', admittedAt: new Date(Date.now() - 36 * 3600000).toISOString() };
    } else if (i === 204) {
      patientData = { patientId: 'pat-7', patientName: 'Aishita Sharma', assignedDoctorId: 'doc-1', admittedAt: new Date(Date.now() - 4 * 3600000).toISOString() };
    } else if (isOccupied) {
      patientData = { patientId: `pat-icu-${i}`, patientName: `Critical Patient ICU-${i}`, assignedDoctorId: 'doc-7', admittedAt: new Date(Date.now() - 14 * 3600000).toISOString() };
    }

    beds.push({
      id,
      name: `ICU Bed ${id}`,
      type: 'bed',
      bedType: 'icu',
      floorId: 'floor-2',
      roomNo: `ICU Pod ${i - 200}`,
      status: isOccupied ? 'occupied' : 'free',
      version: 1,
      isScarce: true,
      currentAllocation: patientData
    });
  }

  return beds;
}

const PATIENTS = [
  {
    patientId: 'pat-1',
    name: 'Ramesh Gupta',
    age: 54,
    gender: 'Male',
    diagnosis: 'Bacterial Pneumonia with Mild Hypoxemia',
    currentBedId: 'G-101',
    assignedDoctorId: 'doc-3',
    assignedDoctorName: 'Dr. Priya Nair',
    admittedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    vitals: { hr: 82, bp: '124/80', spo2: 96, temp: '99.1 F' },
    status: 'admitted'
  },
  {
    patientId: 'pat-2',
    name: 'Sunita Devi',
    age: 62,
    gender: 'Female',
    diagnosis: 'Acute Respiratory Distress Syndrome (ARDS)',
    currentBedId: 'ICU-201',
    assignedDoctorId: 'doc-7',
    assignedDoctorName: 'Dr. Sneha Kulkarni',
    admittedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    vitals: { hr: 110, bp: '95/60', spo2: 91, temp: '101.4 F' },
    status: 'critical'
  },
  {
    patientId: 'pat-3',
    name: 'Rajesh Verma',
    age: 48,
    gender: 'Male',
    diagnosis: 'Acute Coronary Syndrome / Post-MI',
    currentBedId: 'ICU-202',
    assignedDoctorId: 'doc-1',
    assignedDoctorName: 'Dr. Ananya Sharma',
    admittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    vitals: { hr: 98, bp: '140/92', spo2: 95, temp: '98.6 F' },
    status: 'critical'
  },
  {
    patientId: 'pat-4',
    name: 'Meenakshi Sundaram',
    age: 39,
    gender: 'Female',
    diagnosis: 'Multiple Contusions & Observation',
    currentBedId: 'E-01',
    assignedDoctorId: 'doc-4',
    assignedDoctorName: 'Dr. Vikram Rao',
    admittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    vitals: { hr: 76, bp: '118/74', spo2: 99, temp: '98.4 F' },
    status: 'emergency'
  },
  {
    patientId: 'pat-5',
    name: 'Arvind Patel',
    age: 67,
    gender: 'Male',
    diagnosis: 'Right Femur Fracture Post-Fixation',
    currentBedId: 'G-105',
    assignedDoctorId: 'doc-2',
    assignedDoctorName: 'Dr. Rohan Deshmukh',
    admittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    vitals: { hr: 74, bp: '130/84', spo2: 98, temp: '98.8 F' },
    status: 'admitted'
  },
  {
    patientId: 'pat-6',
    name: 'Fatima Khan',
    age: 45,
    gender: 'Female',
    diagnosis: 'Post-Cholecystectomy Sepsis Monitoring',
    currentBedId: 'ICU-203',
    assignedDoctorId: 'doc-6',
    assignedDoctorName: 'Dr. Arjun Mehta',
    admittedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    vitals: { hr: 104, bp: '100/68', spo2: 94, temp: '100.2 F' },
    status: 'critical'
  },
  {
    patientId: 'pat-7',
    name: 'Aishita Sharma',
    age: 58,
    gender: 'Female',
    diagnosis: 'Post-Op Cardiac Monitoring & Arrhythmia Surveillance',
    currentBedId: 'ICU-204',
    assignedDoctorId: 'doc-1',
    assignedDoctorName: 'Dr. Ananya Sharma',
    admittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    vitals: { hr: 92, bp: '135/88', spo2: 97, temp: '98.6 F' },
    status: 'critical'
  },
  {
    patientId: 'pat-8',
    name: 'Vikramaditya Roy',
    age: 51,
    gender: 'Male',
    diagnosis: 'Acute Decompensated Heart Failure (NYHA Class III)',
    currentBedId: 'E-02',
    assignedDoctorId: 'doc-4',
    assignedDoctorName: 'Dr. Vikram Rao',
    admittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    vitals: { hr: 96, bp: '148/94', spo2: 93, temp: '98.9 F' },
    status: 'emergency'
  }
];

// Sample Initial Sagas
const INITIAL_SAGAS = [
  {
    id: 'saga-demo-rx-101',
    type: 'prescription',
    patientId: 'pat-1',
    patientName: 'Ramesh Gupta',
    medicineId: 'med-amoxicillin',
    medicineName: 'Amoxicillin 250mg',
    dosage: '1 capsule orally TDS for 5 days',
    quantity: 15,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    steps: [
      {
        stepName: 'order',
        label: 'Doctor Prescription Order',
        status: 'done',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        actorId: 'doc-3',
        actorName: 'Dr. Priya Nair',
        actorRole: 'doctor',
        details: 'Prescribed 15 capsules of Amoxicillin 250mg'
      },
      {
        stepName: 'dispense',
        label: 'Pharmacy Stock Dispense',
        status: 'done',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        actorId: 'pharm-1',
        actorName: 'Pharmacist Amit Chawla',
        actorRole: 'pharmacy',
        details: 'Stock verified and dispensed to General Floor 1'
      },
      {
        stepName: 'administer',
        label: 'Bedside Nurse Administration',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'nurse',
        details: 'Awaiting bedside administration and vitals logging'
      }
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
      {
        stepName: 'order',
        label: 'Doctor Prescription Order',
        status: 'done',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        actorId: 'doc-7',
        actorName: 'Dr. Sneha Kulkarni',
        actorRole: 'doctor',
        details: 'Urgent bronchodilator prescription'
      },
      {
        stepName: 'dispense',
        label: 'Pharmacy Stock Dispense',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'pharmacy',
        details: 'Queued in Central Pharmacy'
      },
      {
        stepName: 'administer',
        label: 'Bedside Nurse Administration',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'nurse',
        details: 'Awaiting pharmacy dispense'
      }
    ]
  }
];

// Helper: Delete all documents in a subcollection
async function deleteCollection(collectionRef, batchSize = 100) {
  const query = collectionRef.limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

// Main Seeding Execution
async function seedHospitalData() {
  console.log('===============================================================');
  console.log(`🏥 NEXUS CLINICAL RESOURCE TRANSACTION SYSTEM - DATABASE SEEDER`);
  console.log(`🎯 Target Hospital: ${HOSPITAL_ID}`);
  console.log('===============================================================');

  const hospitalRef = db.collection('hospitals').doc(HOSPITAL_ID);

  // 1. Hospital Meta
  console.log('\n[1/7] Writing Hospital Metadata...');
  await hospitalRef.set({
    hospitalId: HOSPITAL_ID,
    name: 'Apex City Hospital & Research Center',
    tagline: 'Level 1 Trauma & Multi-Specialty Tertiary Care Center',
    totalBeds: 38,
    emergencyBeds: 10,
    generalBeds: 20,
    icuBeds: 8,
    operatingTheatres: 3,
    activeStaffCount: 20,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastResetAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Clear Existing Collections for idempotent re-runs
  console.log('[2/7] Clearing previous subcollections (Floors, Resources, Staff, Patients, Events, Sagas)...');
  await deleteCollection(hospitalRef.collection('floors'));
  await deleteCollection(hospitalRef.collection('resources'));
  await deleteCollection(hospitalRef.collection('staff'));
  await deleteCollection(hospitalRef.collection('patients'));
  await deleteCollection(hospitalRef.collection('events'));
  await deleteCollection(hospitalRef.collection('sagas'));
  console.log('   ✓ Old subcollections wiped cleanly.');

  // 3. Populate Floors
  console.log('\n[3/7] Populating 4 Hospital Floors...');
  const floorBatch = db.batch();
  for (const floor of FLOORS) {
    floorBatch.set(hospitalRef.collection('floors').doc(floor.id), {
      ...floor,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  await floorBatch.commit();
  console.log(`   ✓ ${FLOORS.length} Floors created.`);

  // 4. Populate Staff (Doctors, Nurses, Pharmacist, Admin)
  console.log('\n[4/7] Populating Staff Directory (10 Doctors, 8 Nurses, Pharmacist, Admin)...');
  const staffBatch = db.batch();
  const allStaff = [...DOCTORS, ...NURSES, ...OTHER_STAFF];
  for (const staff of allStaff) {
    staffBatch.set(hospitalRef.collection('staff').doc(staff.id), {
      ...staff,
      hospitalId: HOSPITAL_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  await staffBatch.commit();
  console.log(`   ✓ ${allStaff.length} Staff members created.`);

  // 5. Populate Resources (Beds, OTs, Medicines, Equipment)
  console.log('\n[5/7] Populating Hospital Resources (38 Beds, 3 OTs, 8 Medicines, 7 Equipment)...');
  const beds = generateBeds();
  const allResources = [...beds, ...OPERATION_THEATRES, ...MEDICINES, ...DIAGNOSTIC_EQUIPMENT];

  // Batch insert resources in chunks of 200
  for (let i = 0; i < allResources.length; i += 200) {
    const chunk = allResources.slice(i, i + 200);
    const resBatch = db.batch();
    for (const res of chunk) {
      resBatch.set(hospitalRef.collection('resources').doc(res.id), {
        ...res,
        hospitalId: HOSPITAL_ID,
        version: res.version || 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await resBatch.commit();
  }
  console.log(`   ✓ ${allResources.length} Total Resources created.`);
  console.log(`     - Beds: ${beds.length} (10 Emergency, 20 General, 8 ICU)`);
  console.log(`     - OTs: ${OPERATION_THEATRES.length} (General, Cardiac, Orthopedic)`);
  console.log(`     - Medicines: ${MEDICINES.length} (including Scarce Adrenaline stock: 30 units)`);
  console.log(`     - Diagnostic Equipment: ${DIAGNOSTIC_EQUIPMENT.length} (4 Ventilators, MRI, CT, X-Ray)`);

  // 6. Populate Patients
  console.log('\n[6/7] Populating Reference Patients...');
  const patBatch = db.batch();
  for (const patient of PATIENTS) {
    patBatch.set(hospitalRef.collection('patients').doc(patient.patientId), {
      ...patient,
      hospitalId: HOSPITAL_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  await patBatch.commit();
  console.log(`   ✓ ${PATIENTS.length} Patients created.`);

  // 7. Populate Sagas & Initial Audit Events
  console.log('\n[7/7] Populating Sample Sagas and Audit Events...');
  const sagaBatch = db.batch();
  for (const saga of INITIAL_SAGAS) {
    sagaBatch.set(hospitalRef.collection('sagas').doc(saga.id), {
      ...saga,
      hospitalId: HOSPITAL_ID
    });
  }

  // Append initial audit seed event
  const seedEventId = `evt-init-${Date.now()}`;
  sagaBatch.set(hospitalRef.collection('events').doc(seedEventId), {
    id: seedEventId,
    type: 'status_change',
    resourceId: 'SYSTEM_REGISTRY',
    actorId: 'admin-1',
    actorRole: 'admin',
    actorName: 'Hospital Admin Vinit',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    idempotencyKey: `idemp-seed-${Date.now()}`,
    resultingVersion: 1,
    payload: {
      action: 'SYSTEM_INITIALIZATION',
      description: 'Hospital registry populated with 4 floors, 38 beds, 3 OTs, staff, equipment, and pharmacy inventory.',
      floorsCount: FLOORS.length,
      resourcesCount: allResources.length,
      staffCount: allStaff.length
    }
  });

  await sagaBatch.commit();
  console.log(`   ✓ ${INITIAL_SAGAS.length} Active Sagas initialized.`);
  console.log(`   ✓ Initial System Audit Event appended.`);

  console.log('\n===============================================================');
  console.log('🎉 SEEDING COMPLETE! SUMMARY:');
  console.log(`   • Hospital: ${HOSPITAL_ID} ("Apex City Hospital")`);
  console.log(`   • Floors: ${FLOORS.length}`);
  console.log(`   • Beds: 38 (10 Emergency, 20 General, 8 ICU)`);
  console.log(`   • OTs: 3`);
  console.log(`   • Staff: ${allStaff.length} (10 Doctors, 8 Nurses, 1 Pharmacist, 1 Admin)`);
  console.log(`   • Medicines: ${MEDICINES.length} (Adrenaline Injection marked scarce: 30 qty)`);
  console.log(`   • Equipment: ${DIAGNOSTIC_EQUIPMENT.length} (4 Ventilators, MRI, CT, X-Ray)`);
  console.log(`   • Patients: ${PATIENTS.length}`);
  console.log(`   • Sagas: ${INITIAL_SAGAS.length}`);
  console.log('===============================================================\n');
}

// Execute
seedHospitalData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ERROR] Seeding failed:', err);
    process.exit(1);
  });
