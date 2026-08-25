/**
 * Cloud Functions Entry Point for NEXUS Hospital Operations
 * Exports V2 Cloud Functions for OCC Transactions, Distributed Sagas, and Gemini AI.
 */

import { onRequest, onCall } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Import Transactions & Sagas
import {
  executeAllocateResource,
  executeCancelResource,
  executeTransferResource,
  executeEscalateResource
} from './transactions/concurrencyEngine.js';

import {
  startPrescriptionSaga,
  advancePrescriptionSaga,
  compensatePrescriptionSaga
} from './sagas/prescriptionSaga.js';
import { executeTransferSaga } from './sagas/transferSaga.js';

// Import AI Logic & Secret
import { geminiKey } from './ai/geminiClient.js';
import { explainActivityLogic } from './ai/explainActivity.js';
import { suggestUrgencyLogic } from './ai/suggestUrgency.js';
import { parseResourceRequestLogic } from './ai/parseRequest.js';
import { predictAvailabilityLogic } from './ai/predictAvailability.js';
import { getSuggestedActionLogic } from './ai/suggestedAction.js';

// ==========================================
// OCC TRANSACTIONS & SAGA CALLABLES
// ==========================================

export const allocateResource = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await executeAllocateResource(db, hospitalId, params);
});
export const allocateResourceCall = allocateResource;

export const cancelResource = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await executeCancelResource(db, hospitalId, params);
});
export const cancelResourceCall = cancelResource;

export const transferResource = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await executeTransferResource(db, hospitalId, params);
});
export const transferResourceCall = transferResource;

export const escalateResource = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await executeEscalateResource(db, hospitalId, params);
});
export const escalateResourceCall = escalateResource;

// Sagas
export const startPrescription = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await startPrescriptionSaga(db, hospitalId, params);
});
export const startPrescriptionCall = startPrescription;

export const advancePrescription = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await advancePrescriptionSaga(db, hospitalId, params);
});
export const advancePrescriptionCall = advancePrescription;

export const compensatePrescription = onCall(async (request) => {
  const { hospitalId = 'demo-hospital-1', ...params } = request.data || {};
  return await compensatePrescriptionSaga(db, hospitalId, params);
});
export const compensatePrescriptionCall = compensatePrescription;

// ==========================================
// GEMINI FLASH AI FUNCTIONS (V2 With Secrets)
// ==========================================

// Function 1: Explain What Happened
export const explainActivity = onCall({ secrets: [geminiKey] }, async (request) => {
  return await explainActivityLogic(request.data || {});
});
export const explainActivityCall = explainActivity;

// Function 2: Suggest Escalation Urgency
export const suggestUrgency = onCall({ secrets: [geminiKey] }, async (request) => {
  return await suggestUrgencyLogic(request.data || {});
});
export const suggestUrgencyCall = suggestUrgency;

// Function 3: Parse Natural Language Resource Request
export const parseResourceRequest = onCall({ secrets: [geminiKey] }, async (request) => {
  return await parseResourceRequestLogic(request.data || {});
});
export const parseRequestCall = parseResourceRequest;
export const parseResourceRequestCall = parseResourceRequest;

// Function 4: Predict Resource Availability
export const predictAvailability = onCall({ secrets: [geminiKey] }, async (request) => {
  return await predictAvailabilityLogic(request.data || {});
});
export const predictAvailabilityCall = predictAvailability;

// Function 5: Suggested Next Action
export const getSuggestedAction = onCall({ secrets: [geminiKey] }, async (request) => {
  return await getSuggestedActionLogic(request.data || {});
});
export const getSuggestedActionCall = getSuggestedAction;

// Health check endpoint
export const health = onRequest((req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NEXUS Hospital Operations Engine',
    timestamp: new Date().toISOString()
  });
});
