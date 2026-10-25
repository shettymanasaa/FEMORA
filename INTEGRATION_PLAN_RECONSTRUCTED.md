# FEMORA — Integration Plan
**Status:** Reconstructed working plan based on `CORE_ENGINE.md` and `INTEGRATION_CONTRACT.md`  
**Audience:** Person 1 (Frontend), Person 2 (Core Engine), Person 3 (AI integration)  
**Purpose:** Coordinate frontend integration with the existing Core Engine contract. This is a newly prepared plan, not an original project document.

## 1. Scope and ownership

- **Person 1 — Frontend:** Build product screens and connect them to the Core Engine through the public API.
- **Person 2 — Core Engine:** Own the persistence boundary, data contracts, profile lifecycle, repositories, PIN/vault handling, backup/restore, and deterministic safety evaluation.
- **Person 3 — AI integration:** Use the approved payload builder and respect consent and safety gates before requesting AI explanations.

The Core Engine is not responsible for product-screen design, AI service implementation, educational content, reports, or deployment.

## 2. Integration boundary

Frontend code must import `coreApi` from `src/data/public.ts`. It must not import Dexie or access the database directly. `src/data/access.ts` is the persistence adapter; `src/core/db/database.ts` is a legacy compatibility re-export.

Core operations return a result shaped as either:
- Success: `{ ok: true, data: ... }`
- Failure: `{ ok: false, code, message }`

Handle failures in the UI; do not assume every operation succeeds. Keep PINs, raw encryption keys, database handles, and stale decrypted data out of UI state and logs.

## 3. Proposed integration sequence

### Phase A — Confirm the handoff
1. Share the Core Engine source export, `CORE_ENGINE.md`, and `INTEGRATION_CONTRACT.md`.
2. Share this reconstructed plan and the backend/data schema document.
3. Confirm the current public API signatures from `src/data/public.ts` and `src/core/contracts.ts` before wiring screens. If any signature differs from this document, the code and public contract take precedence and the discrepancy should be agreed by the team.

### Phase B — Wire profile and session flow
1. On startup, call the supported public API to retrieve available profiles and active-profile state.
2. Support profile creation, selection, update, and deletion using `coreApi`; render structured persistence status where relevant.
3. For PIN-protected profiles, use the supported unlock flow before protected reads/writes.
4. Respect profile switching and lock invalidation. Do not retain decrypted rows after lock or profile switch.
5. Call `touch(vault)` between repository operations when needed to record activity and maintain the documented inactivity timeout.

### Phase C — Connect feature screens to repositories
Use the repository helpers exposed by `coreApi.repositories` for profile-scoped operations involving:
- `healthProfile`
- `journeyProfiles`
- `checkins`
- `records`
- `appointments`
- `notifications`
- `bookmarks`
- `recentlyViewed`
- `consents`

Use the public journey helpers for journey lifecycle actions. Validate date-only values as `YYYY-MM-DD` and timestamps as ISO-8601. New check-ins should use UTC `loggedAt` timestamps.

### Phase D — Safety and AI boundary
1. Call synchronous `coreApi.evaluateSafety(journey, payload)` when the UI needs an immediate deterministic safety result.
2. Treat `evaluationStatus: unavailable`, `reviewStatus: review_pending`, or a triggered result as **not cleared for AI explanation**.
3. Use `buildAiPayload` from `src/integrations/aiPayload.ts` for AI-bound data rather than constructing a payload from raw database rows.
4. The AI payload builder must enforce consent and reevaluate safety. A missing consent or blocked safety state should be shown as an actionable UI state, not bypassed.
5. Do not send identifiers, dates, notes, free text, raw records, PINs, keys, or database handles in the AI payload. Follow the implementation contract for the exact allowed fields.

### Phase E — Backup and restore
1. Call the public backup API and check the returned result before saving or sharing.
2. If the backup is plaintext, show a clear warning and require explicit user acknowledgement before saving or sharing.
3. Handle unsupported formats, invalid payloads, authentication failures, conflicts, and restore errors without partial UI success.
4. Explain that profile-key recovery requires the existing profile identity and PIN; loss of the encryption key can make encrypted data unrecoverable.

### Phase F — Verification and handoff
1. Run type-checking, tests, lint on application/test sources, and production build.
2. Manually test profile creation, switching, lock/unlock, CRUD, safety-blocked AI flow, backup warning, and restore failure states.
3. Agree on unresolved product/clinical decisions before enabling clinical safety rules or changing consent/retention behavior.
4. Review the final Git diff together before staging or committing. Do not commit, push, or merge without the repository owner’s review and approval.

## 4. Error handling

The Core Engine documents these error codes:
- `VALIDATION`
- `STORAGE_FULL`
- `LOCKED`
- `NOT_FOUND`
- `CONFLICT`
- `CRYPTO`
- `UNKNOWN`

The frontend should translate errors into clear, non-technical messages while preserving appropriate recovery actions. Avoid swallowing errors or displaying success when `ok` is false.

## 5. Team decisions still required

The following are not settled by this plan and must not be invented by the integration:
- Clinically reviewed safety sources and wording
- Symptom-code vocabulary and aggregate definitions
- Menstrual phase vocabulary
- Consent policy and retention/deletion policy
- PIN reset and key-recovery expectations
- Pagination/filter requirements
- Any product behavior that conflicts with the public API or contract

## 6. Acceptance checklist

- [ ] Frontend imports Core Engine only through `src/data/public.ts`.
- [ ] No direct Dexie/database access from frontend feature modules.
- [ ] All async results handle both `ok: true` and `ok: false`.
- [ ] Profile/session changes clear protected UI data appropriately.
- [ ] PIN and key material are never logged or persisted in UI state.
- [ ] Dates and timestamps follow the contract.
- [ ] Safety-unavailable/pending/triggered states do not get treated as clinical clearance.
- [ ] AI requests use `buildAiPayload` and respect consent.
- [ ] Plaintext backup warning and acknowledgement are implemented.
- [ ] Backup/restore errors and conflicts are handled.
- [ ] Required tests and build pass.
- [ ] Team reviews the diff before any Git commit/push/merge.

## 7. Source and limitations

Prepared from the described contents of `CORE_ENGINE.md` and `INTEGRATION_CONTRACT.md`. It is a reconstructed integration plan for handoff; it is not evidence that these phases have already been completed. Verify exact method names, argument types, and return types against the current source before implementation.
