/**
 * Firebase Auth Helpers & Demo Persona Authentication
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config.js';

export const DEMO_PERSONAS = [
  {
    id: 'doc-1',
    authUid: 'demo-doc-1',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@nexus.hospital',
    role: 'doctor',
    specialty: 'Cardiology',
    title: 'Lead Cardiologist',
    avatar: 'AS',
    shift: 'day',
    badgeColor: 'cyan'
  },
  {
    id: 'doc-7',
    authUid: 'demo-doc-7',
    name: 'Dr. Sneha Kulkarni',
    email: 'sneha.kulkarni@nexus.hospital',
    role: 'doctor',
    specialty: 'ICU / Critical Care',
    title: 'ICU Intensivist',
    avatar: 'SK',
    shift: 'day',
    badgeColor: 'cyan'
  },
  {
    id: 'nurse-1',
    authUid: 'demo-nurse-1',
    name: 'Nurse Pooja Pawar',
    email: 'pooja.pawar@nexus.hospital',
    role: 'nurse',
    wardAssigned: 'General Floor 1',
    title: 'Senior Staff Nurse',
    avatar: 'PP',
    shift: 'day',
    badgeColor: 'emerald'
  },
  {
    id: 'pharm-1',
    authUid: 'demo-pharm-1',
    name: 'Pharmacist Amit Chawla',
    email: 'amit.pharmacy@nexus.hospital',
    role: 'pharmacy',
    department: 'Central Pharmacy',
    title: 'Chief Pharmacist',
    avatar: 'AC',
    shift: 'day',
    badgeColor: 'purple'
  },
  {
    id: 'admin-1',
    authUid: 'demo-admin-1',
    name: 'Hospital Admin Vinit',
    email: 'admin.vinit@nexus.hospital',
    role: 'admin',
    department: 'Clinical Operations Command',
    title: 'Operations Director',
    avatar: 'HV',
    shift: 'all',
    badgeColor: 'amber'
  }
];

const LOCAL_USER_KEY = 'nexus_active_user';

export function getPersistedUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : DEMO_PERSONAS[4]; // Default to Admin for comprehensive overview
  } catch {
    return DEMO_PERSONAS[4];
  }
}

export function persistUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (err) {
    // Check if matches demo persona
    const foundDemo = DEMO_PERSONAS.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (foundDemo) {
      persistUser(foundDemo);
      return { success: true, user: foundDemo };
    }
    throw err;
  }
}

export async function signupWithEmail(email, password, role = 'doctor', name = '') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const customUser = {
      id: `usr-${Date.now()}`,
      authUid: userCredential.user.uid,
      email,
      name: name || email.split('@')[0],
      role,
      title: role.toUpperCase()
    };
    persistUser(customUser);
    return { success: true, user: customUser };
  } catch (err) {
    // If offline / demo key, create local session
    const customUser = {
      id: `usr-${Date.now()}`,
      authUid: `uid-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role,
      title: role.toUpperCase()
    };
    persistUser(customUser);
    return { success: true, user: customUser };
  }
}

export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch {
    // ignore
  }
  persistUser(null);
}
