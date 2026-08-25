import { callGemini } from './geminiClient.js';

const SYSTEM_PROMPT = `Extract structured hospital resource request data from this text. Respond ONLY with valid JSON in this exact format, no other text: {"resourceType": "bed"|"ot"|"equipment"|"medicine", "subType": string or null, "urgency": "normal"|"high"|"critical", "reason": short string}. If a field cannot be determined from the text, use null.`;

/**
 * FUNCTION 3: Parse Natural Language Resource Request
 * Returns: { resourceType, subType, urgency, priority, reason }
 */
export async function parseRequest(naturalText = '', hospitalId = 'default-hospital') {
  if (!naturalText || !naturalText.trim()) {
    return null;
  }

  try {
    const rawAiText = await callGemini(SYSTEM_PROMPT, naturalText.trim(), 'gemini-1.5-flash', hospitalId);
    if (rawAiText) {
      const cleanJson = rawAiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate required enum fields
      const validTypes = ['bed', 'ot', 'equipment', 'medicine'];
      const validUrgencies = ['normal', 'high', 'critical', 'urgent'];

      if (parsed && typeof parsed === 'object') {
        const resourceType = validTypes.includes(parsed.resourceType?.toLowerCase()) ? parsed.resourceType.toLowerCase() : 'bed';
        const urgency = validUrgencies.includes(parsed.urgency?.toLowerCase()) ? parsed.urgency.toLowerCase() : 'normal';

        return {
          resourceType,
          subType: parsed.subType || (resourceType === 'bed' ? 'icu' : 'general'),
          urgency,
          priority: urgency === 'urgent' ? 'urgent' : urgency,
          reason: parsed.reason || naturalText.trim()
        };
      }
    }
  } catch (err) {
    console.warn('[Parse Request] AI JSON parsing failed, falling back to rule parser:', err.message);
  }

  // Safe Rule-based parser fallback
  const text = naturalText.toLowerCase();
  let resourceType = 'bed';
  let subType = 'general';
  let priority = 'normal';

  if (text.includes('ot') || text.includes('operation') || text.includes('surger')) {
    resourceType = 'ot';
    subType = text.includes('cardiac') ? 'cardiac' : text.includes('ortho') ? 'orthopedic' : 'general_surgery';
  } else if (text.includes('ventilator') || text.includes('mri') || text.includes('ct') || text.includes('xray') || text.includes('equipment')) {
    resourceType = 'equipment';
    subType = text.includes('ventilator') ? 'ventilator' : text.includes('mri') ? 'mri' : text.includes('ct') ? 'ct' : 'xray';
  } else if (text.includes('medicine') || text.includes('drug') || text.includes('injection') || text.includes('adrenaline') || text.includes('amoxicillin')) {
    resourceType = 'medicine';
    subType = 'emergency_drugs';
  } else {
    resourceType = 'bed';
    subType = text.includes('icu') ? 'icu' : text.includes('emergency') ? 'emergency' : 'general';
  }

  if (text.includes('critical') || text.includes('arrest') || text.includes('stat') || text.includes('immediately')) {
    priority = 'critical';
  } else if (text.includes('urgent') || text.includes('deteriorat') || text.includes('emergency')) {
    priority = 'urgent';
  } else if (text.includes('high') || text.includes('expedite') || text.includes('soon')) {
    priority = 'high';
  }

  return {
    resourceType,
    subType,
    urgency: priority,
    priority,
    reason: naturalText.trim()
  };
}
