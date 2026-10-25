import { describe, it, expect, vi, beforeEach } from 'vitest';
import aiHandler from '../api/ai';
import { getAiExplanation, buildAiPayload } from '../src/ai/payload';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('Fallback Pipeline Deep Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Verifies Grok fallback when Gemini throws an error on server', async () => {
    // Configure both keys
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    process.env.XAI_API_KEY = 'mock-grok-key';
    process.env.AI_ENABLED = 'true';

    // Mock fetch for Grok API
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('api.x.ai')) {
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Grok fallback response text.' } }],
          }),
        } as Response;
      }
      return { ok: false, status: 500 } as Response;
    });

    const validPayload = {
      journey: 'menstrual',
      window: 'last 3 cycles',
      metrics: { cycleLengthAvg: 28 },
      symptomIds: ['cramps'],
      contentPassages: [{ id: 'topic-1', text: 'Sample text' }],
    };

    let statusCode = 200;
    let jsonResult: any = {};

    const req = {
      method: 'POST',
      body: validPayload,
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: '10.0.0.1' },
    } as unknown as VercelRequest;

    const res = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data: any) => {
        jsonResult = data;
        return res;
      }),
    } as unknown as VercelResponse;

    // Call serverless handler
    // Since mock-gemini-key will fail against Google API, it will gracefully fall through to Grok fetch!
    await aiHandler(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResult.ok).toBe(true);
    expect(jsonResult.provider).toBe('grok');
    expect(jsonResult.text).toBe('Grok fallback response text.');
  });

  it('Verifies 502 server response when both Gemini and Grok fail', async () => {
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    process.env.XAI_API_KEY = 'mock-grok-key';
    process.env.AI_ENABLED = 'true';

    // Mock fetch for Grok to fail too
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Grok network timeout'));

    const validPayload = {
      journey: 'maternity',
      window: 'current trimester',
      metrics: { pregnancyWeek: 32 },
      symptomIds: ['fatigue'],
      contentPassages: [{ id: 'topic-mat', text: 'Antenatal care' }],
    };

    let statusCode = 200;
    let jsonResult: any = {};

    const req = {
      method: 'POST',
      body: validPayload,
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: '10.0.0.2' },
    } as unknown as VercelRequest;

    const res = {
      status: vi.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data: any) => {
        jsonResult = data;
        return res;
      }),
    } as unknown as VercelResponse;

    await aiHandler(req, res);

    expect(statusCode).toBe(502);
    expect(jsonResult.code).toBe('PROVIDERS_FAILED');
  });

  it('Verifies client local rule-based fallback when server returns 502', async () => {
    const payloadRes = buildAiPayload({
      journey: 'menopause',
      window: 'last 4 weeks',
      rawMetrics: { hotFlashesPerWeek: 10, sleepDisruptionCount: 5 },
      rawSymptomIds: ['hot_flashes', 'insomnia'],
    });

    expect(payloadRes.ok).toBe(true);
    if (!payloadRes.ok) return;

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ code: 'PROVIDERS_FAILED' }),
    } as Response);

    const clientRes = await getAiExplanation({
      payload: payloadRes.data,
      aiEnabled: true,
      hasConsent: true,
      apiEndpoint: '/api/ai',
    });

    expect(clientRes.ok).toBe(true);
    if (clientRes.ok) {
      expect(clientRes.data.provider).toBe('local_fallback');
      expect(clientRes.data.disclaimer).toContain('Local rule-based fallback');
      expect(clientRes.data.text).toContain('Vasomotor Frequency');
    }
  });

  it('Verifies local fallback when AI is disabled on client without network dispatch', async () => {
    const payloadRes = buildAiPayload({
      journey: 'menstrual',
      window: 'last 3 cycles',
      rawMetrics: { cycleLengthAvg: 28 },
      rawSymptomIds: ['cramps'],
    });

    expect(payloadRes.ok).toBe(true);
    if (!payloadRes.ok) return;

    const fetchSpy = vi.spyOn(global, 'fetch');

    const clientRes = await getAiExplanation({
      payload: payloadRes.data,
      aiEnabled: false, // Disabled
      hasConsent: true,
    });

    expect(clientRes.ok).toBe(true);
    if (clientRes.ok) {
      expect(clientRes.data.provider).toBe('local_fallback');
      expect(clientRes.data.disclaimer).toContain('AI is turned off');
      expect(clientRes.data.text).toContain('Cycle Frequency');
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
