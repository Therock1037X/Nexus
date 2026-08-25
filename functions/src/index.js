/**
 * Firebase Cloud Functions Entrypoint
 * Exports Callable Functions and REST Endpoints for Transactions, Sagas, and AI
 */

import { onRequest, onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';

// Initialize Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Import Transactions
import { executeAllocateResource } from './transactions/allocateResource.js';
import { executeCancelResource } from './transactions/cancelResource.js';
import { executeTransferResource } from './transactions/transferResource.js';
import { executeEscalateResource } from './transactions/escalateResource.js';

// Import Sagas
import {
  startPrescriptionSaga,
  advancePrescriptionSaga,
  compensatePrescriptionSaga
} from './sagas/prescriptionSaga.js';
import { executeTransferSaga } from './sagas/transferSaga.js';

// Import AI Functions
import { explainActivity } from './ai/explainActivity.js';
import { suggestUrgency } from './ai/suggestUrgency.js';
import { parseRequest } from './ai/parseRequest.js';
import { predictAvailability } from './ai/predictAvailability.js';
import { getSuggestedAction } from './ai/suggestedAction.js';
import { geminiApiKey } from './ai/geminiClient.js';

// ==========================================
// CALLABLE FUNCTIONS
// ==========================================

export const allocateResourceCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await executeAllocateResource(db, hospitalId, params);
});

export const cancelResourceCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await executeCancelResource(db, hospitalId, params);
});

export const transferResourceCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await executeTransferResource(db, hospitalId, params);
});

export const escalateResourceCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await executeEscalateResource(db, hospitalId, params);
});

// Sagas
export const startPrescriptionCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await startPrescriptionSaga(db, hospitalId, params);
});

export const advancePrescriptionCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await advancePrescriptionSaga(db, hospitalId, params);
});

export const compensatePrescriptionCall = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data;
  return await compensatePrescriptionSaga(db, hospitalId, params);
});

// AI Callables (with Cloud Functions GEMINI_API_KEY Secret Binding)
export const explainActivityCall = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const { events, hospitalId = 'default-hospital' } = request.data;
  return await explainActivity(events, hospitalId);
});

export const suggestUrgencyCall = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const { clinicalReason, hospitalId = 'default-hospital' } = request.data;
  return await suggestUrgency(clinicalReason, hospitalId);
});

export const parseRequestCall = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const { naturalText, hospitalId = 'default-hospital' } = request.data;
  return await parseRequest(naturalText, hospitalId);
});

export const predictAvailabilityCall = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const { resources, events, hospitalId = 'default-hospital' } = request.data;
  return await predictAvailability(resources, events, hospitalId);
});

export const getSuggestedActionCall = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const { doctorId, doctorName, patients, sagas, events, hospitalId = 'default-hospital' } = request.data;
  return await getSuggestedAction({ doctorId, doctorName, patients, sagas, events, hospitalId });
});

// Health check endpoint
export const health = onRequest((req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NEXUS Hospital Operations Engine',
    timestamp: new Date().toISOString()
  });
});
