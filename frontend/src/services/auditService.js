/**
 * Audit Trail Service
 * Reads and searches the immutable /events collection
 */

import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  DEFAULT_HOSPITAL_ID,
  getEventsCollectionRef
} from '../firebase/firestore.js';

export function subscribeAuditTrail(hospitalId = DEFAULT_HOSPITAL_ID, callback, maxLimit = 100) {
  const eventsRef = getEventsCollectionRef(hospitalId);
  const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(maxLimit));

  // Try Firestore onSnapshot listener
  let unsubFirestore = null;
  try {
    unsubFirestore = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(events);
      } else {
        // Fallback to local store
        const raw = localStorage.getItem('nexus_local_events');
        if (raw) callback(JSON.parse(raw));
      }
    }, (err) => {
      console.warn('[AUDIT] Firestore onSnapshot fallback to local store:', err.message);
      const raw = localStorage.getItem('nexus_local_events');
      if (raw) callback(JSON.parse(raw));
    });
  } catch (err) {
    const raw = localStorage.getItem('nexus_local_events');
    if (raw) callback(JSON.parse(raw));
  }

  // Also listen for local store updates
  const handleLocalUpdate = (e) => {
    if (!e.detail?.key || e.detail.key === 'nexus_local_events' || e.detail.key === 'all') {
      const raw = localStorage.getItem('nexus_local_events');
      if (raw) callback(JSON.parse(raw));
    }
  };
  window.addEventListener('nexus_store_updated', handleLocalUpdate);

  return () => {
    if (unsubFirestore) unsubFirestore();
    window.removeEventListener('nexus_store_updated', handleLocalUpdate);
  };
}
