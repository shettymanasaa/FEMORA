# FEMORA Core Engine

## Scope and setup
This repository contains the minimal React 18 / Vite / TypeScript app shell with React Router and a local Core Engine. It does not implement Person 1's product screens or Person 3's AI service, educational content, reports, or deployment.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

## Ownership and public API
`src/core/contracts.ts` and `src/contract/schemas.ts` hold shared types and runtime validation. `src/data/access.ts` is the single Dexie adapter and persistence boundary. It is the only source module importing Dexie or using the database instance. `src/core/db/database.ts` is a legacy compatibility re-export; new modules should use `src/data/public.ts`. ESLint blocks direct adapter/Dexie imports elsewhere.

Person 1 should consume `coreApi` from `src/data/public.ts`; asynchronous operations return `{ok:true,data}` / `{ok:false,code,message}` results. `coreApi.evaluateSafety(journey,payload)` is intentionally synchronous and returns the deterministic safety contract directly. Its `repositories` object provides profile-scoped CRUD and filtered query helpers for health profile, journeys, check-ins, records, appointments, notifications, bookmarks, recent views, and consents. PIN-related settings stay behind security APIs. Person 3's helper is `buildAiPayload` in `src/integrations/aiPayload.ts`.

## Database and isolation
Dexie versions 1–4 declare all eleven requested tables: `profiles`, `healthProfile`, `journeyProfiles`, `checkins`, `records`, `appointments`, `notifications`, `bookmarks`, `recentlyViewed`, `consents`, and `settings`. Version 2 adds the current profile-scoped indexes, including `[profileId+journey+type]` for records, and migrates legacy profile IDs, appointment timestamps, and PIN verifier metadata without dropping data. Version 3 preserves the previously deployed schema snapshot. Version 4 adds `[profileId+journey+loggedAt]` for check-ins and fills legacy `loggedAt` from the existing creation timestamp (or the recorded date when no valid timestamp exists), without deleting rows. It also normalizes legacy journey start/end date fields. Upgrade tests assert record preservation and indexes.

Every profile row uses its own ID as `profileId`; health and application rows carry their owning `profileId`, and health rows carry a journey. Current indexes cover profile updates, profile+journey, profile+date, profile+journey+date, profile+journey+loggedAt, profile+journey+type, profile+appointment time, and profile-scoped lookups for other tables. New check-ins receive a UTC `loggedAt`; legacy rows with neither a valid creation time nor a valid recorded date are retained but cannot participate in the logged-time index. Indexed profile/date queries are used where their compound indexes exist; other filtered queries remain profile-scoped.

One profile is active per browser tab. Switching increments a session revision and clears the prior vault key. Reads, writes, deletes, and multi-row updates check the active profile; in-flight writes are transactional and abort when the context changes. `wipe` atomically removes profile-scoped rows from every table, including security settings, clears active session/key state, and retains only the profile shell required for restore. `delete` removes the profile and all rows from all eleven tables.

## Security, PIN, and locking
PINs must contain 4–6 digits. PBKDF2-HMAC-SHA-256 uses a random 16-byte per-profile salt and 310,000 iterations. HKDF derives separate `pinCheck` and wrapping keys. A random 256-bit data key is wrapped with AES-GCM and profile ID as authenticated data. IndexedDB stores the salt, KDF version/iterations, verifier, and wrapped key, never a plaintext PIN or raw data key. A compatibility path supports the first local implementation's KDF version-1 records.

Protected health-profile fields, check-in symptoms/data, record payloads, appointment title/notes, notification message, and journey metadata are encrypted at rest with AES-GCM. Enabling PIN protection encrypts existing sensitive fields and writes the protected setting in one transaction; cryptographic work is staged before the IndexedDB transaction, then optimistic row-version checks prevent overwriting concurrent changes. Record ID, profile ID, journey, type, and update timestamp are authenticated as additional data. Protected reads and writes fail when the active key is absent or expired. Data access enforces the ten-minute timeout and invalidates in-flight work when a profile is locked or switched; the frontend should still call `touch(vault)` for user activity between repository calls. First-profile creation requests persistent storage and returns a structured grant state (`granted`, `denied`, `unsupported`, or `error`); the public API can query the same status.

Browser JavaScript cannot guarantee physical erasure of key material copied by the runtime or protect against a compromised browser/device. Short numeric PINs remain vulnerable to offline guessing against persisted verification material; PBKDF2 raises the cost but does not make a 4–6 digit PIN equivalent to a strong password. Lock state is local to each tab, with cross-tab invalidation messages on profile lock or switch. BroadcastChannel is preferred; the storage-event fallback carries only a profile ID, event type, and random source identifier. Receiving tabs clear the matching active key/session. A stale invalidation can cause a safe re-lock, never authorization.

Unencrypted metadata includes profile display name and timestamps; row IDs and profile IDs; journey, record type, and event/date indexes; and security KDF salt, verifier, iteration count, and wrapped-key envelope. These values are needed for local organization, database indexing, or key verification and can reveal some activity patterns. Enabling protection clears the active session after its transactional encryption pass; the profile must be unlocked again before access.

## Journey behavior and date conventions

- **Menstrual:** Check-ins are validated and safety-evaluated before persistence. Cycle day counts the supplied period-start date as day 1. The phase helper uses an ordinal day-number convention and labels the ovulation window estimated. Next-period estimates require at least three start dates, two or more plausible 15–60 day intervals, and interval spread within seven days. `menstrualSummary` returns a typed unavailable reason when dates/history are missing or irregular. This is an unvalidated product heuristic, not clinical guidance or contraception advice.
- **Maternity:** LMP-derived due dates add 280 calendar days in UTC. LMP day is ordinal week 1 day 1; trimester buckets are ordinal weeks 1–13, 14–27, and 28 onward. Missing/invalid dates return unavailable. Pregnancy dates, birth plans, hospital checklist items, doctor questions, appointments, and maternity check-ins have dedicated operations. Postpartum transition is idempotent, records postpartum state on the maternity journey, and preserves pregnancy records/check-ins/appointments. A due date is not required for postpartum state.
- **Menopause:** Check-ins use validated symptom IDs and integer severity 0–10. Trends expose counts and mean severity only. General history is stored in `healthProfile`; treatment history is stored in `records`. Stage is never inferred from age; missing user-supplied stage returns a missing-information result.

Synthetic demo data is created only through `coreApi.loadSampleData`; every demo row is marked `isSample: true`. `resetSampleData` removes only rows with that flag and preserves user-created data. All date-only values use `YYYY-MM-DD` and UTC date arithmetic; timestamps use ISO-8601. Derived values are estimates and are not medical certainty.

## Safety and AI boundary
`evaluateSafety(journey,payload)` is synchronous, deterministic, and network-independent. Its result includes level, stable rule IDs, message key, source ID, review status, evaluation availability, and whether handling is triggered. With the empty catalog, `evaluationStatus` is `unavailable`, `reviewStatus` is `review_pending`, and `triggered` is true with a non-clinical `info` placeholder level; it includes guidance to contact a qualified healthcare professional or local emergency service if symptoms may be urgent. This is explicitly unavailable, review-pending, and triggered, never a safety clearance. No clinical rules are bundled because no credible-source list or clinical review approval was provided. `buildAiPayload` requires consent and independently reevaluates the input check-ins instead of trusting caller-supplied clearance. It blocks whenever the canonical result is unavailable, unreviewed, or triggered and emits only journey, canonical safety/consent metadata, check-in count, and coded symptom aggregates when a reviewed catalog returns no finding. It excludes profile IDs, dates, notes, and raw records. With the current empty rule catalog, AI explanations remain blocked.

## Backups and errors
Backup format is `femora-backup-v1`. PIN-protected profile backups require the unlocked profile data key; an external passphrase is not accepted for a PIN-protected profile because it would only encrypt the outer envelope and could not recover the inner health-record key. Profiles without a PIN export a plaintext payload with `warning: true`; the frontend must get user acknowledgement before saving or sharing it. Profile-key backups remain encrypted using AES-GCM. Malformed derivation parameters, unsupported formats, schema-invalid rows, and authentication failures are rejected. Both envelope and payload are versioned; raw keys, PINs, and plaintext protected health records are excluded. Export uses a consistent IndexedDB read transaction, validates and UTC-normalizes its row payload, and rejects completion if the active profile session changes during encryption. Encrypted rows with non-canonical authenticated `updatedAt` metadata are rejected rather than rewritten. Import inspection validates format, all table row schemas, IDs, duplicates, and profile identity before a transactional merge; the destination profile must be active, while PIN-protected recovery verifies the PIN and activates the matching profile context. Conflicts reject the import; identical rows are idempotent. Restore-after-wipe across representative tables and rollback are tested. A passphrase backup can be decrypted cross-device, but restoration requires an already-created empty profile shell with the same ID; import does not recreate identity or migrate wrapped profile keys. A profile-key backup carries a PIN-protected wrapped-key envelope and can be recovered with the PIN after a wipe; raw keys and PINs are never included. If that key material is lost, the encrypted records cannot be recovered by the engine.

`CoreError` codes include `VALIDATION`, `STORAGE_FULL`, `LOCKED`, `NOT_FOUND`, `CONFLICT`, `CRYPTO`, and `UNKNOWN`. `coreApi` normalizes failures into structured results without exposing notes or credentials.

## Remaining team decisions
Clinical safety sources and wording, menstrual phase vocabulary, symptom code catalog, PIN reset, consent policy, retention/deletion effects, and whether Person 1 needs pagination or additional filters require teammate review. The initial frontend and Person 3 contracts are documented in `INTEGRATION_CONTRACT.md`.







## Public API refinements

Profile-facing APIs expose a `PublicProfile.isEncrypted` value derived from complete valid PIN configuration and the encrypted representation of stored health payloads; malformed or plaintext health rows never report `true`. The value is a storage-protection indicator, not a substitute for cryptographic authentication on decryption. First-profile creation returns a structured persistence state, and later creation checks existing browser persistence rather than prompting again. Plaintext backup exports explicitly include `isEncrypted: false` and `requiresPlaintextWarning: true` (retaining `warning: true` for v1 compatibility). `profiles.wipe` atomically clears profile-scoped rows and settings while preserving the profile shell; it clears a matching local key and invalidates matching sessions in other tabs.
