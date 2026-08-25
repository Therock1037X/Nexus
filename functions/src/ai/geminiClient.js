import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

// Define Firebase Cloud Functions Secret
export const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize Admin SDK if needed
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Shared Gemini Client Wrapper for Firebase Cloud Functions
 * Reads API key from Firebase Secret / environment and manages Flash model calls with logging
 */
export async function callGemini(systemPrompt, userInput, modelName = 'gemini-1.5-flash', hospitalId = 'default-hospital') {
  let apiKey = '';
  try {
    apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY || '';
  } catch (err) {
    apiKey = process.env.GEMINI_API_KEY || '';
  }

  if (!apiKey) {
    console.warn('[Gemini Client] No GEMINI_API_KEY configured. Returning fallback.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(userInput);
    const response = await result.response;
    const outputText = response.text()?.trim() || null;

    // Log request & response to Firestore under /hospitals/{id}/aiLogs/ for debugging
    try {
      await db.collection('hospitals').doc(hospitalId).collection('aiLogs').add({
        systemPrompt,
        userInput: typeof userInput === 'string' ? userInput : JSON.stringify(userInput),
        outputText,
        model: modelName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (logErr) {
      // Safe to ignore logging errors in offline/emulator mode
    }

    return outputText;
  } catch (err) {
    console.error('[Gemini Client] Error executing Gemini prompt:', err.message);
    return null;
  }
}
