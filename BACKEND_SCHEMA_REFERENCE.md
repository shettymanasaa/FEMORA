# FEMORA — Backend / Core Data Schema
**Status:** Integration reference derived from the Core Engine documentation provided  
**Important:** This is a documentation-level schema summary, not a database migration file. Verify exact fields and indexes against the current implementation in `src/data/access.ts` and the contract types before relying on it.

## 1. Persistence model

FEMORA uses IndexedDB through Dexie. `src/data/access.ts` is the single persistence adapter and owns database access. Frontend modules should use `coreApi` from `src/data/public.ts`, not access Dexie directly.

The database documentation describes 11 tables:

| Table | Purpose described by the contract/docs | Ownership / notes |
|---|---|---|
| `profiles` | Profile identity and profile-level metadata | Profile row uses its own ID as `profileId`; profile shell can be preserved by wipe |
| `healthProfile` | Health profile data | Profile-scoped; sensitive fields may be encrypted |
| `journeyProfiles` | Per-journey profile metadata | Profile-scoped; sensitive journey metadata may be encrypted |
| `checkins` | User check-ins / symptoms | Profile- and journey-scoped; new rows use UTC `loggedAt` |
| `records` | User health records/payloads | Profile- and journey-scoped; sensitive payload may be encrypted |
| `appointments` | Appointment information | Profile-scoped; title/notes may be encrypted |
| `notifications` | Notification content | Profile-scoped; message may be encrypted |
| `bookmarks` | Saved/bookmarked items | Profile-scoped |
| `recentlyViewed` | Recently viewed items | Profile-scoped |
| `consents` | Consent records used by gated features | Profile-scoped |
| `settings` | Security and profile settings, including PIN-related metadata | Profile-scoped; removed by wipe |

The exact property list for each row is implementation-defined and should be taken from `src/core/contracts.ts`, schema validators, and the current adapter—not inferred from this summary.

## 2. Common fields and conventions

- `profileId` associates user data with its owning profile.
- Journey-related records may include `journey`.
- Date-only values use `YYYY-MM-DD`.
- Timestamps use ISO-8601.
- New check-ins use immutable UTC `loggedAt`.
- Legacy check-ins without a valid creation/recorded date are retained during migration, but cannot participate in the `loggedAt` index.
- IDs, profile IDs, journey/type metadata, event/date indexes, and some security metadata remain plaintext for querying and migration.

## 3. Indexing and schema versions

The Core Engine documentation describes Dexie schema versions 1–4:
- **Version 1:** Initial schema.
- **Version 2:** Adds profile-scoped indexes, migrates legacy profile IDs, normalizes appointment timestamps, and adds PIN verifier metadata without data loss.
- **Version 3:** Preserves a schema snapshot for compatibility/migration.
- **Version 4:** Adds `[profileId+journey+loggedAt]` to `checkins`, fills `loggedAt` for legacy rows where possible, and normalizes journey start/end dates.

Documented index patterns include profile lookup, profile + journey, profile + date, profile + journey + date, profile + journey + loggedAt, profile + journey + type, profile + appointment time, and other profile-scoped lookups. Confirm the exact index declarations in the current schema before writing queries or migrations.

## 4. Security and encryption model

- PINs are documented as 4–6 digits.
- Key derivation uses PBKDF2-HMAC-SHA-256 with a random 16-byte per-profile salt and 310,000 iterations.
- HKDF derives verifier and wrapping keys.
- A random 256-bit data key is wrapped with AES-GCM; profile ID is used as additional authenticated data.
- IndexedDB stores KDF metadata, verifier, salt, and wrapped-key envelope—not the raw PIN or raw data key.
- Sensitive health/check-in/record/appointment/notification/journey fields may be encrypted with AES-GCM.
- Enabling PIN protection is documented as encrypting existing sensitive fields and updating security settings transactionally.
- Protected operations require an active unlocked key and respect lock timeout/session changes.
- `isEncrypted` is a storage-representation indicator; it is not proof that ciphertext will authenticate successfully.
- Some metadata remains unencrypted as described above.

## 5. Profile lifecycle and transaction behavior

- One active profile per browser tab is documented.
- Switching profile changes session revision and clears the prior vault key.
- Reads and writes must respect the active profile; multi-row writes use transactions and abort on context change.
- `wipeProfile(profileId)` removes profile-scoped rows and security settings while preserving the profile shell, clears the matching active session/key, and notifies other tabs. It does not guarantee physical erasure from storage media.
- `deleteProfile(profileId)` removes the profile identity and associated rows from all 11 tables.

## 6. Backup and restore

- Backup format: `femora-backup-v1`.
- An unlocked profile-key backup can carry an encrypted backup using the profile key.
- An unprotected profile backup is plaintext and must be accompanied by a clear warning and explicit frontend acknowledgement before saving or sharing.
- Import validates format, table schemas, IDs, duplicates, profile identity, and authentication before transactional merge.
- Conflicts are rejected; identical rows may be treated idempotently.
- A profile-key backup recovery depends on the existing profile identity and PIN. Passphrase backup restore requires an existing empty profile shell with the same ID; import does not recreate identity or migrate wrapped keys.
- If the encryption key is lost, encrypted records may be unrecoverable.

## 7. Public API boundary

Frontend integration should use `coreApi` from `src/data/public.ts`. The documented areas include:
- Profile lifecycle and persistence status
- Profile-scoped repository CRUD/filter helpers
- Journey operations
- PIN/vault security operations
- Backup/restore
- Synchronous deterministic safety evaluation
- Consent-gated AI payload construction via `buildAiPayload` in `src/integrations/aiPayload.ts`

Async public operations are documented to return `{ ok: true, data }` or `{ ok: false, code, message }`. Safety evaluation is intentionally synchronous.

## 8. Safety / AI data boundary

- Safety evaluation is deterministic and network-independent.
- The documented empty safety catalog state is `evaluationStatus: unavailable`, `reviewStatus: review_pending`, `triggered: true`, with an informational placeholder and guidance to contact a healthcare professional/local emergency service if urgent.
- Such a state is not medical clearance and must not be bypassed for AI explanation.
- `buildAiPayload` reevaluates safety and requires consent. It blocks unavailable/unreviewed/triggered states and missing consent.
- AI payloads should exclude identifiers, dates, notes, free text, raw records, database handles, PINs, and key material. Follow the actual builder's implementation for the precise allowed aggregate fields.

## 9. Items to verify before implementation

- [ ] Exact row fields and required/optional properties in `src/core/contracts.ts`.
- [ ] Exact runtime validators in `src/contract/schemas.ts`.
- [ ] Exact Dexie index strings and version migration definitions in `src/data/access.ts`.
- [ ] Exact public method names, arguments, and return types in `src/data/public.ts`.
- [ ] Current check-in index declarations match the documented version-4 migration.
- [ ] No frontend module imports Dexie or bypasses `coreApi`.
- [ ] Safety catalog and consent requirements are not bypassed.
- [ ] Team reviews clinical, consent, retention, and recovery decisions before release.
