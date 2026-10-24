# FEMORA — Feature Status Checklist

This document tracks the implementation status across all subsystems.

---

## 1. Person 3 Scope (AI, Reports, Content, Deployment & QA)

| Feature / Component | Status | Verification & Notes |
| :--- | :--- | :--- |
| **Client AI Module (`src/ai/`)** | **DONE** | Strict allowlist builder, Zod validation, preview generator, and on-device rule-based fallback implemented and tested. |
| **Vercel Serverless AI Proxy (`api/ai.ts`)** | **DONE** | Strict Zod validation, request size limit (10KB), IP rate limiting, Gemini primary + Grok fallback, safe error responses. |
| **API Health Check (`api/ping.ts`)** | **DONE** | Returns service status, timestamp, and provider configuration status. |
| **Reviewed Medical Content (`content/`)** | **DONE** | 21 Markdown topics created across Menstrual, Maternity, and Menopause with credible sources and explicit `reviewed` vs `pending` status. |
| **MiniSearch Search Engine (`src/content/search.ts`)** | **DONE** | Fast in-browser BM25-style keyword search with journey filters and strict exclusion of pending topics from AI grounding. |
| **Synthetic Demo Dataset (`src/data/demoData.ts`)** | **DONE** | Deterministic sample dataset for all 3 journeys with `isSample: true`. Resettable and wipeable. |
| **PDF Report Generation (`src/reports/`)** | **DONE** | Built using `@react-pdf/renderer` for Menstrual, Maternity, and Menopause. Supports date range filtering and section exclusion. |
| **Sexual Wellbeing Privacy in Reports** | **DONE** | Excluded by default; included only upon explicit opt-in and setting enablement. |
| **In-App Notifications (`src/data/notifications.ts`)** | **DONE** | Generates in-app reminders from saved appointments without duplicates or external push services. |
| **Automated Test Suite (`tests/`)** | **DONE** | 30 tests covering AI whitelist, content parsing, reports, multi-profile isolation, and error handling passing. |
| **Vercel Deployment Configuration (`vercel.json`)** | **DONE** | Configured for static SPA hosting and serverless functions at `/api/*`. |
| **Documentation Suite (`docs/`, `README.md`)** | **DONE** | Complete architecture, data-flow, environment, testing, limitations, and setup guides. |

---

## 2. Shared Contracts & Handoff Interfaces

| Shared Contract Interface | Status | Notes |
| :--- | :--- | :--- |
| `src/types.ts` | **DONE** | Shared data models, journey enums, report types, AI payloads, and notification interfaces. |
| `src/contract/index.ts` | **DONE** | Central contract exporting Person 3 functions for consumption by Person 1 and Person 2. |
| `evaluateSafety()` integration | **DONE** | Person 3 AI pipeline strictly integrates with Person 2's safety result to suppress AI on red flags. |

---

## 3. Person 1 & Person 2 Scopes (External to Person 3)

| Component | Owner | Status | Notes |
| :--- | :--- | :--- | :--- |
| Frontend Screens (`src/pages/`, `src/ui/`) | Person 1 | **Assigned to Person 1** | Person 1 will build the UI screens calling Person 3's contract functions. |
| Dexie DB Core Engine & Migrations | Person 2 | **Assigned to Person 2** | Database tables, indexes, and migrations. |
| PBKDF2 / AES-GCM Payload Encryption & PIN | Person 2 | **Assigned to Person 2** | Local-first key derivation and payload encryption. |
| Cycle & Pregnancy Calculation Engine | Person 2 | **Assigned to Person 2** | Cycle day estimation, trimester progression. |
