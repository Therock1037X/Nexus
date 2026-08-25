/**
 * LLM Client Wrapper
 * Integrates with Google Gemini API via @google/generative-ai or REST,
 * with resilient offline heuristic fallback for guaranteed demo reliability.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

/**
 * Executes a prompt with Gemini, falling back to a custom heuristic generator if no key is configured.
 * 
 * @param {string} prompt
 * @param {object} options
 * @param {function} fallbackFn
 * @returns {Promise<string>}
 */
export async function generateContentWithFallback(prompt, options = {}, fallbackFn = null) {
  const apiKey = options.apiKey || GEMINI_API_KEY;
  
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: options.model || 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (apiErr) {
      console.warn('[AI] Gemini API call error, using deterministic fallback engine:', apiErr.message);
    }
  }

  // Fallback to local heuristic generator
  if (typeof fallbackFn === 'function') {
    return fallbackFn();
  }

  return 'AI Service: Processed with standard clinical rules.';
}
