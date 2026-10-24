# FEMORA — Environment Variables & Configuration Guide

FEMORA strictly separates **serverless environment variables** from **client build-time variables** to prevent accidental exposure of secret provider API keys.

---

## 1. Server-Side Variables (Vercel Serverless Function `/api/ai`)

These variables are defined in the Vercel Project Settings or local `.env` and **must never be prefixed with `VITE_`**.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | String | *(Required for live AI)* | Google AI Studio API key for Gemini 1.5 Flash. |
| `XAI_API_KEY` | String | *(Required for fallback)* | xAI API key for Grok 2 Mini fallback. |
| `AI_PRIMARY_MODEL` | String | `gemini-1.5-flash` | Name of the primary Gemini model. |
| `AI_FALLBACK_MODEL` | String | `grok-2-mini` | Name of the secondary Grok model. |
| `AI_ENABLED` | Boolean | `true` | Setting to `false` disables AI proxy and returns HTTP 503. |
| `AI_TIMEOUT_MS` | Number | `8000` | Milliseconds to wait for primary provider before failing over. |
| `AI_MAX_TOKENS` | Number | `600` | Maximum token cap for generated explanations. |
| `AI_RATE_LIMIT_PER_MIN` | Number | `20` | Max requests permitted per IP address per minute. |

---

## 2. Frontend Build-Time Variables (Client Bundle)

These variables are consumed by Vite during compilation.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_AI_ENDPOINT` | String | `/api/ai` | URL path to the serverless AI proxy. |
| `VITE_APP_ENV` | String | `development` | Target environment (`development`, `staging`, `production`). |
| `VITE_USE_MOCKS` | Boolean | `false` | When `true`, mock data handlers are used locally. |

---

## 3. Security Guidelines
1. **Never Commit Secrets:** Real keys must never be committed to git. Use `.env.example` as a template.
2. **Bundle Verification:** Vitest integration tests verify that `GEMINI_API_KEY` and `XAI_API_KEY` are not accessible via `import.meta.env`.
3. **Graceful Degradation:** If neither key is configured in a staging or preview environment, `/api/ai` returns HTTP 502 with code `PROVIDERS_UNAVAILABLE`, and the client automatically activates on-device rule-based insights.
