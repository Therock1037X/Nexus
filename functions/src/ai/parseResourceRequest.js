/**
 * AI Feature 3: Natural Language Resource Request Parser
 * Parses physician free-text speech or prompt into structured resource request fields.
 */

import { generateContentWithFallback } from './llmClient.js';

export async function parseResourceRequest(naturalText = '', apiKey = '') {
  if (!naturalText || naturalText.trim().length === 0) {
    return null;
  }

  const prompt = `You are a Medical NLP parser. Convert the doctor's unstructured resource request into a structured JSON object.

Available Resource Types:
- "bed" (subTypes: "icu", "emergency", "general")
- "ot" (subTypes: "general_surgery", "cardiac", "orthopedic")
- "equipment" (subTypes: "ventilator", "mri", "ct", "xray")
- "medicine"

Available Priorities:
- "critical", "urgent", "high", "normal"

Input Natural Language Prompt:
"${naturalText}"

Return ONLY valid JSON matching this schema:
{
  "resourceType": "bed" | "ot" | "equipment" | "medicine",
  "subType": string,
  "priority": "critical" | "urgent" | "high" | "normal",
  "reason": "extracted clinical reason / diagnosis",
  "patientAge": number or null,
  "patientGender": "Male" | "Female" | null,
  "equipmentNeeded": string[]
}`;

  const fallbackParser = () => {
    const lower = naturalText.toLowerCase();
    let resourceType = 'bed';
    let subType = 'general';
    let priority = 'normal';
    let reason = naturalText;
    const equipmentNeeded = [];

    if (lower.includes('ventilator')) equipmentNeeded.push('ventilator');
    if (lower.includes('icu') || lower.includes('intensive')) {
      resourceType = 'bed';
      subType = 'icu';
    } else if (lower.includes('emergency') || lower.includes('er ') || lower.includes('casualty')) {
      resourceType = 'bed';
      subType = 'emergency';
    } else if (lower.includes('ot') || lower.includes('operation') || lower.includes('theatre') || lower.includes('surgery')) {
      resourceType = 'ot';
      subType = lower.includes('cardiac') ? 'cardiac' : (lower.includes('ortho') ? 'orthopedic' : 'general_surgery');
    } else if (lower.includes('mri') || lower.includes('scanner') || lower.includes('x-ray') || lower.includes('ct')) {
      resourceType = 'equipment';
      subType = lower.includes('mri') ? 'mri' : (lower.includes('ct') ? 'ct' : 'xray');
    }

    if (lower.includes('stat') || lower.includes('critical') || lower.includes('arrest') || lower.includes('emergency') || lower.includes('immediate')) {
      priority = 'critical';
    } else if (lower.includes('urgent') || lower.includes('asap') || lower.includes('rapid')) {
      priority = 'urgent';
    } else if (lower.includes('high') || lower.includes('severe')) {
      priority = 'high';
    }

    return JSON.stringify({
      resourceType,
      subType,
      priority,
      reason: naturalText.length > 80 ? naturalText.substring(0, 80) + '...' : naturalText,
      patientAge: null,
      patientGender: null,
      equipmentNeeded
    });
  };

  const rawResult = await generateContentWithFallback(prompt, { apiKey, model: 'gemini-2.5-flash' }, fallbackParser);

  try {
    const jsonStr = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    return JSON.parse(fallbackParser());
  }
}
