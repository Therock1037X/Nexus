/**
 * Firestore References and Utilities
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, DEFAULT_HOSPITAL_ID } from './config.js';

export const getHospitalDocRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  doc(db, 'hospitals', hospitalId);

export const getResourcesCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'resources');

export const getResourceDocRef = (resourceId, hospitalId = DEFAULT_HOSPITAL_ID) =>
  doc(db, 'hospitals', hospitalId, 'resources', resourceId);

export const getEventsCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'events');

export const getSagasCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'sagas');

export const getSagaDocRef = (sagaId, hospitalId = DEFAULT_HOSPITAL_ID) =>
  doc(db, 'hospitals', hospitalId, 'sagas', sagaId);

export const getPatientsCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'patients');

export const getStaffCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'staff');

export const getFloorsCollectionRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'floors');

export {
  db,
  DEFAULT_HOSPITAL_ID,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction
};

