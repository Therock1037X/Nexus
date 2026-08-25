import admin from 'firebase-admin';
import { callGemini } from './geminiClient.js';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const SYSTEM_PROMPT = `You are summarizing hospital activity for a non-technical hospital administrator. Given this list of events, write a short, factual, plain-English summary (2-4 sentences) of what happened and in what order. Use simple everyday words. Do not use technical terms like transaction, saga, deterministic, or concurrency. Do not invent any detail not present in the data. If the events show a conflict between two requests, clearly state which one won and why, in one plain sentence.`;

/**
 * FUNCTION 1: Explain What Happened (Activity Summary)
 */
export async function explainActivityLogic(data) {
  const { resourceId, patientId, hospitalId = 'default-hospital', events = [] } = data || {};

  let eventList = events;

  // If events not provided, fetch from Firestore
  if (!eventList || eventList.length === 0) {
    try {
      let query = db.collection('hospitals').doc(hospitalId).collection('events');
      if (resourceId) {
        query = query.where('resourceId', '==', resourceId);
      } else if (patientId) {
        query = query.where('payload.patientId', '==', patientId);
      }
      const snap = await query.orderBy('timestamp', 'desc').limit(15).get();
      if (!snap.empty) {
        eventList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[ExplainActivity] Firestore fetch fallback:', err.message);
    }
  }

  if (!eventList || eventList.length === 0) {
    return { summary: 'No recent events recorded for this resource or patient.' };
  }

  // Format events clearly for Gemini
  const formattedEvents = eventList.map(e => ({
    time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Recent',
    action: e.payload?.action || e.type,
    resource: e.resourceId || 'Bed / Resource',
    staff: e.actorName || 'Clinical Staff',
    details: e.payload?.details || e.payload?.reason || e.payload?.rejectionReason || 'Care activity update'
  }));

  const aiResult = await callGemini(
    SYSTEM_PROMPT,
    JSON.stringify(formattedEvents, null, 2),
    { hospitalId }
  );

  if (aiResult.success && aiResult.data) {
    return { summary: aiResult.data.replace(/```/g, '').trim() };
  }

  // Fallback summary if AI call fails
  const allocs = eventList.filter(e => e.type === 'allocate' || e.type === 'reserve').length;
  const preempts = eventList.filter(e => e.type === 'escalation_preemption' || e.type === 'conflict_resolved').length;
  const rejections = eventList.filter(e => e.type === 'conflict_rejected').length;

  let fallback = `In the recorded history, ${eventList.length} updates took place. `;
  if (allocs > 0) fallback += `${allocs} resource allocations were assigned successfully. `;
  if (preempts > 0) fallback += `An emergency priority override was safely applied for an acute patient. `;
  if (rejections > 0) fallback += `A lower-urgency request was held because the bed was already occupied. `;

  return { summary: fallback.trim() };
}
