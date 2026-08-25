/**
 * Idempotency Check Utility
 * Prevents double-processing of network retries or concurrent duplicates.
 */

/**
 * Checks if an event with the given idempotencyKey has already been committed.
 * @param {FirebaseFirestore.Transaction} transaction - Firestore transaction instance
 * @param {FirebaseFirestore.CollectionReference} eventsRef - Reference to /hospitals/{hospitalId}/events
 * @param {string} idempotencyKey - Client-generated UUID or hash
 * @returns {Promise<{ isDuplicate: boolean, existingEvent: any }>}
 */
export async function checkIdempotency(transaction, eventsRef, idempotencyKey) {
  if (!idempotencyKey) {
    return { isDuplicate: false, existingEvent: null };
  }

  // Query events for matching idempotencyKey
  const query = eventsRef.where('idempotencyKey', '==', idempotencyKey).limit(1);
  const snapshot = await transaction.get(query);

  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    return {
      isDuplicate: true,
      existingEvent: { id: existingDoc.id, ...existingDoc.data() }
    };
  }

  return { isDuplicate: false, existingEvent: null };
}
