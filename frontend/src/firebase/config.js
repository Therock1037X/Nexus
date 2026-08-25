/**
 * Firebase Web Client Configuration
 * Supports live Firebase projects and provides seamless local fallback
 * for zero-friction hackathon demos.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyNexusClinical2026Hackathon",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexus-clinical-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexus-clinical-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexus-clinical-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "103700000001",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:103700000001:web:nexusdemo1037"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const DEFAULT_HOSPITAL_ID = 'demo-hospital-1';

console.log('[FIREBASE] Client initialized for project:', firebaseConfig.projectId);
