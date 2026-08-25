import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `Extract structured hospital resource request data from this text. Respond ONLY with valid JSON, no other text, in this exact shape: {"resourceType": "bed"|"ot"|"equipment"|"medicine", "subType": string|null, "urgency": "normal"|"high"|"critical", "reason": string}. Use null for anything you cannot determine.`;

const VALID_TYPES = ['bed', 'ot', 'equipment', 'medicine'];
const VALID_URGENCIES = ['normal', 'high', 'critical'];

/**
 * FUNCTION 3: Parse Natural Language Resource Request
 */
export async function parseResourceRequestLogic(data) {
  const { requestText = '', naturalText = '', hospitalId = 'default-hospital' } = data || {};
  const text = requestText || naturalText;

  if (!text || !text.trim()) {
    return { success: false, error: 'EMPTY_INPUT' };
  }

  const aiResult = await callGemini(SYSTEM_PROMPT, text.trim(), { hospitalId });

  if (aiResult.success && aiResult.data) {
    try {
      const cleanJson = aiResult.data.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (
        parsed &&
        typeof parsed === 'object' &&
        'resourceType' in parsed &&
        'subType' in parsed &&
        'urgency' in parsed &&
        'reason' in parsed
      ) {
        // Enforce valid enums
        const resourceType = VALID_TYPES.includes(String(parsed.resourceType).toLowerCase())
          ? String(parsed.resourceType).toLowerCase()
          : 'bed';

        const urgency = VALID_URGENCIES.includes(String(parsed.urgency).toLowerCase())
          ? String(parsed.urgency).toLowerCase()
          : 'normal';

        return {
          success: true,
          data: {
            resourceType,
            subType: parsed.subType || null,
            urgency,
            reason: String(parsed.reason || text.substring(0, 80))
          }
        };
      }
    } catch (parseErr) {
      console.warn('[ParseRequest] JSON parsing error from Gemini output:', parseErr.message);
    }
  }

  // Deterministic Keyword Heuristic Fallback
  const lower = text.toLowerCase();
  let resourceType = 'bed';
  let subType = null;
  let urgency = 'normal';

  if (lower.includes('ventilator') || lower.includes('vent')) {
    resourceType = 'equipment';
    subType = 'Ventilator';
  } else if (lower.includes('ot') || lower.includes('theatre') || lower.includes('surgery') || lower.includes('cardiac or')) {
    resourceType = 'ot';
    subType = 'Cardiac Surgery';
  } else if (lower.includes('x-ray') || lower.includes('mri') || lower.includes('ct scan')) {
    resourceType = 'equipment';
    subType = 'Imaging';
  } else if (lower.includes('paracetamol') || lower.includes('amoxicillin') || lower.includes('insulin') || lower.includes('salbutamol') || lower.includes('medicine')) {
    resourceType = 'medicine';
  } else if (lower.includes('icu') || lower.includes('critical care')) {
    resourceType = 'bed';
    subType = 'icu';
  } else if (lower.includes('er') || lower.includes('emergency bay') || lower.includes('trauma')) {
    resourceType = 'bed';
    subType = 'emergency';
  } else {
    resourceType = 'bed';
    subType = 'general';
  }

  if (lower.includes('stat') || lower.includes('critical') || lower.includes('arrest') || lower.includes('stemi')) {
    urgency = 'critical';
  } else if (lower.includes('urgent') || lower.includes('asap') || lower.includes('rapid') || lower.includes('high')) {
    urgency = 'high';
  }

  return {
    success: true,
    data: {
      resourceType,
      subType,
      urgency,
      reason: text.length > 80 ? text.substring(0, 80) + '...' : text
    }
  };
}
