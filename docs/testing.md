# FEMORA — Quality Assurance & Testing Report

This document records the automated testing commands, scenarios, and verified execution results across Person 3 deliverables.

---

## 1. Test Commands

| Command | Purpose | Expected Result |
| :--- | :--- | :--- |
| `npm run test` | Executes full Vitest automated test suite | 30 tests pass |
| `npm run typecheck` | Validates strict TypeScript compilation (`tsc --noEmit`) | 0 errors |
| `npm run build` | Builds production artifacts (`tsc && vite build`) | Successful bundle |

---

## 2. Test Suites & Scenarios

### A. AI Layer Tests (`tests/ai.test.ts`)
- [x] **Valid Payload Acceptance:** Valid whitelisted fields (journey, window, numeric metrics, approved symptom IDs) pass client and server schemas.
- [x] **Strict Whitelist Rejection:** Unapproved metrics and unknown fields are stripped on the client and rejected with HTTP 400 on the server.
- [x] **Sensitive Field Exclusion:** Schema fails if names, free-text notes, birthdates, or sexual wellbeing fields are present.
- [x] **What Gets Sent Preview:** `previewAiPayload()` generates human-readable preview and notes excluded categories.
- [x] **Safety Flag Blocking:** AI request is immediately blocked when `safetyFlagRaised: true`, preventing network calls.
- [x] **AI Disabled Mode:** Returns local rule-based explanation without calling external servers.
- [x] **Missing Consent:** Returns `LOCKED` error when consent is not granted.
- [x] **Server Rate Limiter:** Returns HTTP 429 when IP exceeds requests per minute.
- [x] **Server AI Disabled:** Returns HTTP 503 when `AI_ENABLED=false`.
- [x] **Unconfigured Providers:** Returns HTTP 502 with safe JSON when keys are missing.

### B. Medical Content Library Tests (`tests/content.test.ts`)
- [x] **Front Matter Parsing:** All 21 markdown topics parse front matter (`id`, `title`, `journey`, `sources`, `reviewStatus`).
- [x] **Topic ID Uniqueness:** 21 unique IDs across all journeys.
- [x] **Source Credibility:** Every topic contains formal citation metadata (WHO, NHS, ACOG, etc.).
- [x] **Pending Status Flagging:** Newly drafted content remains explicitly marked as `pending` review.
- [x] **MiniSearch Keyword Search:** Searches titles, keywords, and content bodies with relevance ranking and excerpts.
- [x] **Empty Query Handling:** Returns journey-filtered lists when query string is empty.
- [x] **AI Grounding Filter:** `getReviewedPassagesForAi()` strictly filters out pending topics.

### C. PDF Report Engine Tests (`tests/reports.test.ts`)
- [x] **Menstrual Report:** Builds report model from saved records with executive metrics and symptoms table.
- [x] **Maternity Report:** Formats gestational stage, due date, and care provider without errors.
- [x] **Menopause Report:** Captures reported stage and vasomotor frequency accurately.
- [x] **Date Range Filtering:** Only records within `startDate` and `endDate` appear in the report.
- [x] **Section Exclusion:** Removing optional sections (e.g., appointments, AI explanations) successfully excludes them from output.
- [x] **Sexual Wellbeing Privacy:** Excluded by default; included only upon explicit opt-in and setting enablement.
- [x] **PDF Blob Generation:** `@react-pdf/renderer` generates a valid binary PDF `Blob`.
- [x] **Share Action:** Shares via Web Share API on mobile or falls back to direct download.

### D. Multi-Profile Isolation & Privacy Tests (`tests/privacy_and_integration.test.ts`)
- [x] **Profile Isolation:** Records and notes of Profile B are completely isolated and never appear in Profile A's reports or AI payloads.
- [x] **In-App Notifications:** Generates reminders for upcoming appointments; prevents duplicate reminders on repeated app open; ignores cancelled/done appointments.
- [x] **Synthetic Demo Reset:** Loads deterministic sample data (`isSample: true`), resets cleanly, and wipes completely.
- [x] **Network Fallback:** Handles HTTP 400, 429, 502, 503 by seamlessly falling back to local rule-based insights.

---

## 3. Actual Execution Results

```text
 RUN  v2.1.9 C:/Users/NANDHITHA RATAN/OneDrive/Documents/FEMORA

 ✓ tests/content.test.ts (7 tests) 31ms
 ✓ tests/ai.test.ts (11 tests) 38ms
 ✓ tests/privacy_and_integration.test.ts (4 tests) 104ms
 ✓ tests/reports.test.ts (8 tests) 276ms

 Test Files  4 passed (4)
      Tests  30 passed (30)
   Duration  1.68s
```

All 30 automated unit, integration, and privacy tests have executed and passed.
TypeScript compilation (`npm run typecheck`) and production build (`npm run build`) passed with zero errors.
