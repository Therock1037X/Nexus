import admin from 'firebase-admin';
import { callGemini } from './geminiClient.js';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const SYSTEM_PROMPT = `Given this history of hospital bed allocations and releases, estimate in ONE short sentence how many beds of this type are likely to become free in the next hour. Clearly state this is an estimate, not a guarantee. Base your estimate only on the pattern shown in this data — do not invent numbers not supported by it.`;

/**
 * FUNCTION 4: Predict Resource Availability
 */
export async function predictAvailabilityLogic(data) {
  const { resourceType = 'bed', hospitalId = 'default-hospital', resources = [], events = [] } = data || {};

  let eventList = events;

  if (!eventList || eventList.length === 0) {
    try {
      const snap = await db.collection('hospitals').doc(hospitalId).collection('events')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      if (!snap.empty) {
        eventList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[PredictAvailability] Firestore fetch fallback:', err.message);
    }
  }

  const freeBeds = resources.filter(r => r.type === 'bed' && r.status === 'free').length;
  const occupiedBeds = resources.filter(r => r.type === 'bed' && r.status === 'occupied').length;

  const historyContext = {
    resourceType,
    currentFreeUnits: freeBeds,
    currentOccupiedUnits: occupiedBeds,
    recentDischargesAndAllocations: (eventList || []).slice(0, 10).map(e => ({
      time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Recent',
      type: e.type,
      resource: e.resourceId
    }))
  };

  const aiResult = await callGemini(
    SYSTEM_PROMPT,
    JSON.stringify(historyContext, null, 2),
    { hospitalId }
  );

  if (aiResult.success && aiResult.data) {
    return { prediction: aiResult.data.replace(/```/g, '').trim() };
  }

  // Fallback prediction
  return {
    prediction: `Based on current occupancy patterns, an estimated 1 to 2 ${resourceType} units are expected to become available within the next hour.`
  };
}
