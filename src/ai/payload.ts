import { z } from 'zod';
import {
  AiPayload,
  AiResponse,
  Journey,
  Result,
  ContentPassage,
} from '../types';
import { getReviewedPassagesForAi } from '../content/search';
import { generateLocalRuleBasedExplanation } from './localFallback';

// =========================================================================
// Strict Zod Whitelist Validation on Client
// =========================================================================
const ContentPassageSchema = z
  .object({
    id: z.string().min(1).max(100),
    text: z.string().min(1).max(2000),
  })
  .strict();

export const ClientAiPayloadSchema = z
  .object({
    journey: z.enum(['menstrual', 'maternity', 'menopause']),
    window: z.string().min(1).max(100),
    metrics: z.record(z.string().max(50), z.number()),
    symptomIds: z.array(z.string().max(50)).max(20),
    contentPassages: z.array(ContentPassageSchema).max(5),
  })
  .strict(); // Rejects unknown fields!

// Explicit list of allowed metric names (whitelist)
const ALLOWED_METRIC_KEYS = new Set([
  'cycleLengthAvg',
  'periodDurationDays',
  'cycleDay',
  'painScoreAvg',
  'painScoreMax',
  'energyScoreAvg',
  'sleepHoursAvg',
  'moodScoreAvg',
  'symptomDaysCount',
  'pregnancyWeek',
  'trimesterNumber',
  'hotFlashesPerWeek',
  'nightSweatsCount',
  'sleepDisruptionCount',
  'vasomotorEpisodes',
]);

// Explicit list of approved symptom IDs (whitelist)
const ALLOWED_SYMPTOM_IDS = new Set([
  'cramps',
  'fatigue',
  'headache',
  'bloating',
  'breast_tenderness',
  'acne',
  'nausea',
  'mood_swings',
  'backache',
  'anxiety',
  'insomnia',
  'hot_flashes',
  'night_sweats',
  'joint_stiffness',
  'vaginal_dryness',
  'urinary_urgency',
  'round_ligament_pain',
  'edema',
  'heartburn',
  'pelvic_pressure',
]);

export interface BuildAiPayloadOptions {
  journey: Journey;
  window: string;
  rawMetrics: Record<string, number | unknown>;
  rawSymptomIds: string[];
  searchQuery?: string;
  overridePassages?: ContentPassage[];
}

/**
 * buildAiPayload() is the ONLY application function permitted to assemble the AI payload.
 * It builds exclusively from an explicit allowlist and rejects unapproved fields.
 * NEVER serializes full records; never includes notes, nicknames, dates, or sexual wellbeing.
 */
export function buildAiPayload(
  options: BuildAiPayloadOptions
): Result<AiPayload> {
  // Filter metrics strictly against allowlist and ensure numeric
  const safeMetrics: Record<string, number> = {};
  for (const [key, val] of Object.entries(options.rawMetrics || {})) {
    if (ALLOWED_METRIC_KEYS.has(key) && typeof val === 'number' && !isNaN(val)) {
      safeMetrics[key] = Math.round(val * 10) / 10;
    }
  }

  // Filter symptomIds strictly against approved set
  const safeSymptomIds: string[] = (options.rawSymptomIds || []).filter(
    (sym) =>
      typeof sym === 'string' &&
      ALLOWED_SYMPTOM_IDS.has(sym.toLowerCase().trim())
  );

  // Retrieve reviewed educational passages (never pending!)
  let safePassages: ContentPassage[] = [];
  if (options.overridePassages && options.overridePassages.length > 0) {
    safePassages = options.overridePassages.slice(0, 3);
  } else {
    const query =
      options.searchQuery ||
      safeSymptomIds.slice(0, 3).join(' ') ||
      options.journey;
    safePassages = getReviewedPassagesForAi(query, options.journey, 2);
  }

  const candidatePayload: AiPayload = {
    journey: options.journey,
    window: options.window.slice(0, 100),
    metrics: safeMetrics,
    symptomIds: safeSymptomIds.slice(0, 15),
    contentPassages: safePassages,
  };

  // Validate with strict Zod schema
  const validation = ClientAiPayloadSchema.safeParse(candidatePayload);
  if (!validation.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: `Invalid AI payload structure: ${validation.error.message}`,
    };
  }

  return {
    ok: true,
    data: candidatePayload,
  };
}

export interface AiPayloadPreview {
  journey: Journey;
  window: string;
  includedMetrics: Array<{ name: string; value: number }>;
  symptomsList: string[];
  groundingTopicIds: string[];
  sensitiveFieldsExcluded: string[];
  rawJsonPreview: string;
}

/**
 * Returns a human-readable preview of the exact payload that will be transmitted,
 * enabling transparent user review before proceeding.
 */
export function previewAiPayload(payload: AiPayload): AiPayloadPreview {
  const includedMetrics = Object.entries(payload.metrics).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const groundingTopicIds = payload.contentPassages.map((p) => p.id);

  return {
    journey: payload.journey,
    window: payload.window,
    includedMetrics,
    symptomsList: [...payload.symptomIds],
    groundingTopicIds,
    sensitiveFieldsExcluded: [
      'Name / Nickname',
      'Exact calendar dates & birth dates',
      'Personal notes & diary free text',
      'Appointment locations & doctor names',
      'Sexual Wellbeing data (completely excluded)',
      'Raw database identifiers & PIN',
    ],
    rawJsonPreview: JSON.stringify(payload, null, 2),
  };
}

export interface GetAiExplanationOptions {
  payload: AiPayload;
  aiEnabled: boolean;
  hasConsent: boolean;
  safetyFlagRaised?: boolean;
  apiEndpoint?: string;
  signal?: AbortSignal;
}

/**
 * Requests an AI explanation from the Vercel proxy.
 * Enforces all safety constraints:
 * 1. Skips AI if safety flag was raised.
 * 2. Skips AI if AI is disabled or consent is missing.
 * 3. Falls back gracefully to local rule-based insights if providers fail.
 */
export async function getAiExplanation(
  options: GetAiExplanationOptions
): Promise<Result<AiResponse>> {
  const { payload, aiEnabled, hasConsent, safetyFlagRaised } = options;

  // Rule 1: Never make an AI request if check-in triggered a safety flag!
  if (safetyFlagRaised) {
    return {
      ok: false,
      code: 'LOCKED',
      message:
        'AI explanation skipped: A safety flag was raised for this check-in. Predefined clinical safety guidance must be prioritized.',
    };
  }

  // Rule 2: Respect user setting and explicit consent
  if (!aiEnabled) {
    const fallbackText = generateLocalRuleBasedExplanation(payload);
    return {
      ok: true,
      data: {
        text: fallbackText,
        provider: 'local_fallback',
        disclaimer:
          'Local rule-based insight (AI is turned off in settings). No data left your device.',
      },
    };
  }

  if (!hasConsent) {
    return {
      ok: false,
      code: 'LOCKED',
      message:
        'Explicit consent is required before transmitting anonymous health numbers for AI explanation.',
    };
  }

  // Determine endpoint
  const endpoint =
    options.apiEndpoint ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_AI_ENDPOINT) ||
    '/api/ai';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (res.ok) {
      const data = (await res.json()) as {
        ok: boolean;
        text: string;
        provider: 'gemini' | 'grok';
        disclaimer: string;
      };
      return {
        ok: true,
        data: {
          text: data.text,
          provider: data.provider,
          disclaimer:
            data.disclaimer ||
            'AI-generated explanation. Not clinical advice. For educational support only.',
        },
      };
    }

    // Provider error or 502/503/429 -> Fallback to local rule-based engine
    const errorJson = await res.json().catch(() => ({}));
    const fallbackText = generateLocalRuleBasedExplanation(payload);

    return {
      ok: true,
      data: {
        text: fallbackText,
        provider: 'local_fallback',
        disclaimer: `Local rule-based fallback (${
          errorJson.code || `HTTP ${res.status}`
        }). No external AI was used.`,
      },
    };
  } catch (err: unknown) {
    // Network failure or timeout -> Fallback locally
    const fallbackText = generateLocalRuleBasedExplanation(payload);
    return {
      ok: true,
      data: {
        text: fallbackText,
        provider: 'local_fallback',
        disclaimer:
          'Local rule-based fallback (Network unreachable). No external AI was used.',
      },
    };
  }
}
