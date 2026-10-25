import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Method Not Allowed. Use GET.',
    });
  }

  const aiEnabled = process.env.AI_ENABLED !== 'false';
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const grokConfigured = Boolean(process.env.XAI_API_KEY);

  return res.status(200).json({
    status: 'ok',
    service: 'femora-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiConfig: {
      enabled: aiEnabled,
      geminiConfigured,
      grokConfigured,
      primaryModel: process.env.AI_PRIMARY_MODEL || 'gemini-1.5-flash',
      fallbackModel: process.env.AI_FALLBACK_MODEL || 'grok-2-mini',
      timeoutMs: Number(process.env.AI_TIMEOUT_MS || 8000),
      rateLimitPerMin: Number(process.env.AI_RATE_LIMIT_PER_MIN || 20),
    },
  });
}
