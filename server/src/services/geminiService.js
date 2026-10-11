/**
 * Gemini triage service.
 * Called ONLY from the server — the API key never reaches the browser.
 * If the response is invalid, missing fields, or confidence < 0.70,
 * falls back to "Needs Human Review" so the user is never blocked.
 * Demo Only: Use Fictional Data
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORIES, PRIORITIES } from '@helpdesk/shared';

const CONFIDENCE_THRESHOLD = 0.70;
const TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Fallback — used when Gemini fails, times out, or returns invalid output
// ---------------------------------------------------------------------------
const FALLBACK = {
  category: 'Needs Human Review',
  priority: 'Medium',
  routeTo: 'Help Desk — Manual Review',
  canAutoResolve: false,
  etaHours: 48,
  summary:
    'We received your issue but could not automatically classify it. A help desk agent will review it within 48 hours.',
  aiConfidenceLow: true,
};

// ---------------------------------------------------------------------------
// System instruction
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `
You are a university help desk triage assistant for a DEMO system that uses FICTIONAL DATA only.

You will receive a free-text issue description from a student or staff member.
Your job is to classify it and return a SINGLE raw JSON object with NO markdown, NO code fences, NO extra text.

Allowed categories (choose the best match):
${CATEGORIES.filter((c) => c !== 'Needs Human Review')
  .map((c) => `- "${c}"`)
  .join('\n')}

Priority levels: "Low" | "Medium" | "High" | "Urgent"
- "Urgent": completely blocks academic progress (e.g. locked out during exams, cannot register during registration week)
- "High": financial or graduation impact
- "Medium": issue can wait 1–3 days without academic harm
- "Low": informational or cosmetic

canAutoResolve: true if IT Help Desk can resolve without escalating to another department.

etaHours: integer estimate. Use one of: 2, 4, 8, 24, 48, 72, 168.

summary: 1–2 plain-language sentences addressed to the submitter. Confirm what was understood and what happens next.

confidence: number between 0 and 1 indicating classification certainty.

Return ONLY this JSON object:
{
  "category": "<one of the allowed categories>",
  "priority": "<Low|Medium|High|Urgent>",
  "routeTo": "<department name>",
  "canAutoResolve": <true|false>,
  "etaHours": <integer>,
  "summary": "<1–2 sentences>",
  "confidence": <0.0–1.0>
}
`.trim();

// ---------------------------------------------------------------------------
// Validation of Gemini JSON output
// ---------------------------------------------------------------------------
function validateTriageResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!CATEGORIES.includes(parsed.category)) return false;
  if (!PRIORITIES.includes(parsed.priority)) return false;
  if (typeof parsed.routeTo !== 'string' || !parsed.routeTo.trim()) return false;
  if (typeof parsed.canAutoResolve !== 'boolean') return false;
  if (!Number.isInteger(parsed.etaHours) || parsed.etaHours <= 0) return false;
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) return false;
  if (typeof parsed.confidence !== 'number') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

let _genAI = null;

function getClient() {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

/**
 * Calls the Gemini API to triage an issue description.
 * Always resolves — never rejects. Falls back on any failure.
 *
 * @param {string} description - The sanitised issue description from the submitter.
 * @returns {Promise<{category, priority, routeTo, canAutoResolve, etaHours, summary, aiConfidenceLow}>}
 */
export async function triageIssue(description) {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Race against a timeout so a slow API call doesn't hold up the user
    const generatePromise = model.generateContent(description);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out')), TIMEOUT_MS),
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const rawText = result.response.text().trim();

    // Strip accidental markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[Gemini] JSON parse failed. Raw response:', rawText);
      return FALLBACK;
    }

    if (!validateTriageResponse(parsed)) {
      console.error('[Gemini] Response failed field validation:', parsed);
      return FALLBACK;
    }

    if (parsed.confidence < CONFIDENCE_THRESHOLD) {
      console.warn(`[Gemini] Low confidence (${parsed.confidence}). Falling back.`);
      return FALLBACK;
    }

    return {
      category: parsed.category,
      priority: parsed.priority,
      routeTo: parsed.routeTo,
      canAutoResolve: parsed.canAutoResolve,
      etaHours: parsed.etaHours,
      summary: parsed.summary,
      aiConfidenceLow: false,
    };
  } catch (err) {
    console.error('[Gemini] Unexpected error:', err.message);
    return FALLBACK;
  }
}
