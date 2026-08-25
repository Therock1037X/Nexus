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

// Import AI
import { explainAuditTrail } from './ai/explainAuditTrail.js';
import { suggestEscalationPriority } from './ai/suggestEscalationPriority.js';
import { parseResourceRequest } from './ai/parseResourceRequest.js';
import { predictAvailability } from './ai/predictAvailability.js';

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

// AI Callables
export const generateAuditExplanationCall = onCall(async (request) => {
  const { events, apiKey } = request.data;
  return await explainAuditTrail(events, apiKey);
});

export const suggestPriorityCall = onCall(async (request) => {
  const { clinicalReason, apiKey } = request.data;
  return await suggestEscalationPriority(clinicalReason, apiKey);
});

export const parseRequestCall = onCall(async (request) => {
  const { naturalText, apiKey } = request.data;
  return await parseResourceRequest(naturalText, apiKey);
});

export const predictAvailabilityCall = onCall(async (request) => {
  const { resources, recentEvents, apiKey } = request.data;
  return await predictAvailability(resources, recentEvents, apiKey);
});

// Health check endpoint
export const health = onRequest((req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NEXUS Clinical Resource Transaction System',
    timestamp: new Date().toISOString()
  });
});
