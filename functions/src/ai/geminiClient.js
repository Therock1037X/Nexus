import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

// Define Firebase Cloud Functions Secret
export const geminiKey = defineSecret('GEMINI_API_KEY');

// Initialize Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Shared Gemini Client Wrapper for Firebase Cloud Functions
 * - Initializes Gemini client using geminiKey.value() inside the function call
 * - Uses Gemini 1.5 Flash
 * - 10-second timeout to prevent hanging
 * - Returns { success: true, data } or { success: false, error }
 */
export async function callGemini(systemPrompt, userInput, options = {}) {
  const {
    modelName = 'gemini-1.5-flash',
    hospitalId = 'default-hospital',
    timeoutMs = 10000
  } = options;

  let apiKey = '';
  try {
    apiKey = geminiKey.value() || process.env.GEMINI_API_KEY || '';
  } catch {
    apiKey = process.env.GEMINI_API_KEY || '';
  }

  if (!apiKey) {
    console.warn('[Gemini Client] No GEMINI_API_KEY secret bound or available.');
    return { success: false, error: 'NO_API_KEY' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });

    // 10-Second Timeout Race
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT_EXCEEDED')), timeoutMs)
    );

    const generatePromise = (async () => {
      const result = await model.generateContent(
        typeof userInput === 'string' ? userInput : JSON.stringify(userInput)
      );
      const response = await result.response;
      return response.text()?.trim() || '';
    })();

    const outputText = await Promise.race([generatePromise, timeoutPromise]);

    // Async debug logging to Firestore under /hospitals/{id}/aiLogs
    try {
      db.collection('hospitals').doc(hospitalId).collection('aiLogs').add({
        systemPrompt,
        userInput: typeof userInput === 'string' ? userInput : JSON.stringify(userInput),
        outputText,
        model: modelName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    } catch {
      // safe ignore log errors
    }

    return { success: true, data: outputText };
  } catch (err) {
    console.error('[Gemini Client] Error executing prompt:', err.message);
    return { success: false, error: err.message };
  }
}
