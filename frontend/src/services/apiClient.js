/**
 * NEXUS Frontend API Client
 * Connects React UI to the Express backend server (http://localhost:5000/api)
 * with transparent fallback to Firestore & local storage if offline.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isBackendAvailable = null;
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        this.isBackendAvailable = true;
        return true;
      }
      this.isBackendAvailable = false;
      return false;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  async post(endpoint, data) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || 'Backend request failed');
      err.code = json.code || 'API_ERROR';
      err.details = json;
      throw err;
    }
    return json;
  }

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${this.baseUrl}${endpoint}?${query}` : `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, { method: 'GET' });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Backend request failed');
    }
    return json;
  }

  // Transactions
  async allocateResource(data) {
    return await this.post('/transactions/allocate', data);
  }

  async cancelResource(data) {
    return await this.post('/transactions/cancel', data);
  }

  // Sagas
  async startPrescriptionSaga(data) {
    return await this.post('/sagas/prescription/start', data);
  }

  async advancePrescriptionSaga(data) {
    return await this.post('/sagas/prescription/advance', data);
  }

  async compensatePrescriptionSaga(data) {
    return await this.post('/sagas/prescription/compensate', data);
  }

  // Patients
  async admitPatient(data) {
    return await this.post('/patients/admit', data);
  }

  async reassignPatient(data) {
    return await this.post('/patients/reassign', data);
  }

  async attachDocument(data) {
    return await this.post('/patients/document', data);
  }

  async getPatients(doctorId = null) {
    return await this.get('/patients', doctorId ? { doctorId } : {});
  }

  // AI Intelligence
  async parseNaturalRequest(naturalText) {
    return await this.post('/ai/parse-request', { naturalText });
  }

  async suggestPriority(clinicalReason) {
    return await this.post('/ai/suggest-priority', { clinicalReason });
  }

  async explainAuditTrail(events) {
    const res = await this.post('/ai/explain', { events });
    return res.summary;
  }

  async getSuggestedAction(doctorId, doctorName, patients = [], sagas = [], events = []) {
    return await this.post('/ai/suggested-action', { doctorId, doctorName, patients, sagas, events });
  }

  // Telemetry & Stats
  async getResources() {
    return await this.get('/resources');
  }

  async getStats() {
    return await this.get('/stats');
  }

  async resetSeed() {
    return await this.post('/seed/reset', {});
  }
}

export const apiClient = new ApiClient();
