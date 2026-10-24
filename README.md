# FEMORA — Care for every phase of her life

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-30%20passing-brightgreen.svg)]()

FEMORA is a women's health tracking, education, and clinical consultation preparation application designed around three life stages: **Menstrual Health**, **Maternity & Postpartum**, and **Menopause Care**.

This repository contains **Person 3's core deliverables**: the privacy-preserving AI layer (Gemini + Grok fallback), reviewed medical education library, in-browser keyword search (MiniSearch), on-device PDF report generator (@react-pdf/renderer), deterministic synthetic demo data, in-app notifications, Vercel serverless deployment configuration, and automated test suite.

---

## 1. Quick Start & Local Development

### Prerequisites
- Node.js `v18.0.0` or later (tested on Node v24)
- npm `v9.0.0` or later

### Installation & Execution
```bash
# 1. Clone repository and checkout delivery branch
git checkout delivery

# 2. Install dependencies
npm install

# 3. Run automated test suite (Vitest)
npm run test

# 4. Run TypeScript typecheck
npm run typecheck

# 5. Build production bundle
npm run build
```

---

## 2. Person 3 Architecture & Deliverables

### A. AI Integration (`api/ai.ts`, `src/ai/`)
- **Serverless Proxy:** One stateless Vercel function at `/api/ai`. Does not log request bodies or health data.
- **Provider Fallback:** Google Gemini 1.5 Flash (primary) with automatic failover to xAI Grok 2 Mini (fallback).
- **Client Allowlist Enforcement:** `buildAiPayload()` strictly enforces the whitelist (journey, relative time window, aggregate numbers, approved symptom IDs, and reviewed text). Rejects unknown fields with 400.
- **Privacy Preview:** `previewAiPayload()` provides a human-readable preview before any request.
- **Clinical Safety Rule:** AI requests are **strictly skipped** if a check-in triggers a clinical safety flag.
- **Offline Fallback:** `generateLocalRuleBasedExplanation()` provides rule-based insights when offline or when providers are unreachable.

### B. Reviewed Medical Content Library (`content/`, `src/content/`)
- 21 structured Markdown topics organized by journey (`menstrual/`, `maternity/`, `menopause/`).
- Authoritative sources: WHO, NHS, ACOG, NICE, and BMS.
- Explicit `reviewStatus` (`reviewed` vs `pending`).
- Pending topics are strictly excluded from AI prompt grounding.
- Fast client-side search via `MiniSearch` (`searchContent`, `getTopic`).

### C. PDF Report Engine (`src/reports/`)
- Generates doctor-ready consultation reports on-device using `@react-pdf/renderer`.
- Three report types: Menstrual, Maternity, Menopause.
- Date range filtering, symptom frequency table, executive metrics, and clinical disclaimers.
- Confidential Sexual Wellbeing data is excluded by default and included only with explicit user permission.
- Direct download and native Web Share API support.

### D. Synthetic Demo Dataset (`src/data/demoData.ts`, `src/data/demoLoader.ts`)
- Resettable, deterministic sample profile (`Maya (Demo)`).
- Every demo row carries `isSample: true`.
- Representative records for all three journeys.
- Loader functions: `loadDemoData()`, `resetDemoData()`, `wipeDemoData()`.

### E. In-App Notifications (`src/data/notifications.ts`)
- `generateNotifications()` generates reminders for upcoming appointments on app launch.
- No background daemons, SMS, or external push services.
- Deduplicates reminders and ignores completed or cancelled visits.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# Serverless API Keys (Vercel Serverless Function Only)
GEMINI_API_KEY=your_gemini_api_key_here
XAI_API_KEY=your_xai_api_key_here
AI_PRIMARY_MODEL=gemini-1.5-flash
AI_FALLBACK_MODEL=grok-2-mini
AI_ENABLED=true
AI_TIMEOUT_MS=8000
AI_MAX_TOKENS=600
AI_RATE_LIMIT_PER_MIN=20

# Client Build Variables
VITE_AI_ENDPOINT=/api/ai
VITE_APP_ENV=development
VITE_USE_MOCKS=false
```

---

## 4. Verification & Testing Summary

Run the automated test suite:
```bash
npm run test
```

Pass results:
- **`tests/ai.test.ts` (11 tests):** Whitelist validation, unknown field rejection, preview builder, safety flag blocking, 400/429/502/503 server responses.
- **`tests/content.test.ts` (7 tests):** Front matter parsing, unique IDs, source citations, pending flag enforcement, MiniSearch ranking.
- **`tests/reports.test.ts` (8 tests):** 3 report types, date filtering, optional section removal, sexual wellbeing exclusion, PDF blob rendering, sharing.
- **`tests/privacy_and_integration.test.ts` (4 tests):** Multi-profile data isolation, in-app appointment notifications, deterministic demo reset flow.

**Total: 30 passed (100% pass rate).**

---

## 5. Documentation Directory

- [`docs/architecture.md`](docs/architecture.md) — System architecture, subsystems, and fallback pipelines.
- [`docs/data-flow.md`](docs/data-flow.md) — What stays on the device vs. what leaves it.
- [`docs/environment.md`](docs/environment.md) — Complete environment variable reference.
- [`docs/testing.md`](docs/testing.md) — Test scenarios, execution details, and pass results.
- [`docs/feature-status.md`](docs/feature-status.md) — Deliverable status breakdown and team boundaries.
- [`docs/known-limitations.md`](docs/known-limitations.md) — Local storage, browser limits, and provider considerations.
