import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildAiPayload,
  previewAiPayload,
  getAiExplanation,
  ClientAiPayloadSchema,
} from '../src/ai/payload';
import { generateLocalRuleBasedExplanation } from '../src/ai/localFallback';
import aiHandler, { AiPayloadSchema } from '../api/ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('AI Layer - Client Payload Construction & Whitelist Integrity', () => {
  it('accepts a valid payload conforming to the strict whitelist', () => {
    const result = buildAiPayload({
      journey: 'menstrual',
      window: 'last 3 cycles',
      rawMetrics: {
        cycleLengthAvg: 28,
        painScoreAvg: 4.5,
        symptomDaysCount: 5,
      },
      rawSymptomIds: ['cramps', 'fatigue'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.journey).toBe('menstrual');
      expect(result.data.metrics.cycleLengthAvg).toBe(28);
      expect(result.data.symptomIds).toContain('cramps');
    }
  });

  it('strictly rejects unknown or unapproved metric fields', () => {
    const rawMetrics: Record<string, unknown> = {
      cycleLengthAvg: 28,
      unapprovedMetric: 999, // Should be ignored by whitelist
      patientWeightGuess: 50, // Should be ignored
    };

    const result = buildAiPayload({
      journey: 'menstrual',
      window: 'last 3 cycles',
      rawMetrics,
      rawSymptomIds: ['cramps'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.metrics).toHaveProperty('cycleLengthAvg');
      expect(result.data.metrics).not.toHaveProperty('unapprovedMetric');
      expect(result.data.metrics).not.toHaveProperty('patientWeightGuess');
    }
  });

  it('never transmits sensitive fields: names, notes, dates, or sexual wellbeing', () => {
    const payloadWithSensitiveData = {
      journey: 'menstrual' as const,
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [{ id: 'test-topic', text: 'Reviewed medical text' }],
      // Illegitimate sensitive fields attempting injection:
      patientName: 'Jane Doe',
      diaryNotes: 'Private note about symptoms',
      exactBirthDate: '1995-05-12',
      sexualActivityLog: 'Confidential details',
    };

    // Client schema validation must reject unknown fields
    const clientValidation = ClientAiPayloadSchema.safeParse(payloadWithSensitiveData);
    expect(clientValidation.success).toBe(false);

    // Server schema validation must independently reject unknown fields
    const serverValidation = AiPayloadSchema.safeParse(payloadWithSensitiveData);
    expect(serverValidation.success).toBe(false);
  });

  it('previewAiPayload exposes a human-readable preview and notes excluded fields', () => {
    const payload = {
      journey: 'menopause' as const,
      window: 'last 4 weeks',
      metrics: { hotFlashesPerWeek: 12 },
      symptomIds: ['hot_flashes', 'insomnia'],
      contentPassages: [{ id: 'menopause-common-symptoms', text: 'Vasomotor flashes.' }],
    };

    const preview = previewAiPayload(payload);
    expect(preview.journey).toBe('menopause');
    expect(preview.includedMetrics).toHaveLength(1);
    expect(preview.sensitiveFieldsExcluded).toContain('Name / Nickname');
    expect(preview.sensitiveFieldsExcluded).toContain(
      'Sexual Wellbeing data (completely excluded)'
    );
    expect(preview.rawJsonPreview).toContain('hotFlashesPerWeek');
  });

  it('never makes an AI request when safety flag is raised', async () => {
    const validPayload = {
      journey: 'menstrual' as const,
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const fetchSpy = vi.spyOn(global, 'fetch');

    const result = await getAiExplanation({
      payload: validPayload,
      aiEnabled: true,
      hasConsent: true,
      safetyFlagRaised: true, // Emergency/Safety Flag Raised!
    });

    expect(result.ok).toBe(false);
    expect((result as any).code).toBe('LOCKED');
    expect((result as any).message).toContain('safety flag was raised');
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('returns local rule-based explanation when AI is disabled in settings', async () => {
    const payload = {
      journey: 'menstrual' as const,
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28, painScoreAvg: 4 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const result = await getAiExplanation({
      payload,
      aiEnabled: false, // User disabled AI
      hasConsent: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.provider).toBe('local_fallback');
      expect(result.data.disclaimer).toContain('AI is turned off');
      expect(result.data.text).toContain('Cycle Frequency');
    }
  });

  it('refuses AI request when consent is missing', async () => {
    const payload = {
      journey: 'menstrual' as const,
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const result = await getAiExplanation({
      payload,
      aiEnabled: true,
      hasConsent: false, // Missing consent
    });

    expect(result.ok).toBe(false);
    expect((result as any).code).toBe('LOCKED');
    expect((result as any).message).toContain('Explicit consent is required');
  });
});

describe('AI Layer - Serverless /api/ai Proxy Verification', () => {
  beforeEach(() => {
    process.env.AI_ENABLED = 'true';
    process.env.AI_RATE_LIMIT_PER_MIN = '20';
  });

  function createMockReqRes(body: unknown, headers: Record<string, string> = {}) {
    const req = {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        ...headers,
      },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as VercelRequest;

    let statusCode = 200;
    let jsonResponse: Record<string, unknown> = {};

    const res = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data: Record<string, unknown>) => {
        jsonResponse = data;
        return res;
      }),
    } as unknown as VercelResponse;

    return {
      req,
      res,
      getStatus: () => statusCode,
      getJson: () => jsonResponse,
    };
  }

  it('returns 400 when payload contains unexpected fields', async () => {
    const badPayload = {
      journey: 'menstrual',
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
      unexpectedField: 'HACK',
    };

    const { req, res, getStatus, getJson } = createMockReqRes(badPayload);
    await aiHandler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson().code).toBe('INVALID_PAYLOAD');
  });

  it('returns 503 when AI is globally disabled', async () => {
    process.env.AI_ENABLED = 'false';

    const validPayload = {
      journey: 'menstrual',
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const { req, res, getStatus, getJson } = createMockReqRes(validPayload);
    await aiHandler(req, res);

    expect(getStatus()).toBe(503);
    expect(getJson().code).toBe('AI_DISABLED');
  });

  it('returns 429 when rate limit per IP is exceeded', async () => {
    process.env.AI_RATE_LIMIT_PER_MIN = '2';

    const validPayload = {
      journey: 'menstrual',
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const uniqueIp = `192.168.10.${Math.floor(Math.random() * 200)}`;

    // Call 1: OK
    const m1 = createMockReqRes(validPayload, { 'x-forwarded-for': uniqueIp });
    await aiHandler(m1.req, m1.res);

    // Call 2: OK
    const m2 = createMockReqRes(validPayload, { 'x-forwarded-for': uniqueIp });
    await aiHandler(m2.req, m2.res);

    // Call 3: Rate limited!
    const m3 = createMockReqRes(validPayload, { 'x-forwarded-for': uniqueIp });
    await aiHandler(m3.req, m3.res);

    expect(m3.getStatus()).toBe(429);
    expect(m3.getJson().code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('returns 502 when both AI providers are unconfigured', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.XAI_API_KEY;

    const validPayload = {
      journey: 'menstrual',
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [],
    };

    const { req, res, getStatus, getJson } = createMockReqRes(validPayload, {
      'x-forwarded-for': '10.0.0.99',
    });
    await aiHandler(req, res);

    expect(getStatus()).toBe(502);
    expect(getJson().code).toBe('PROVIDERS_UNAVAILABLE');
  });
});

