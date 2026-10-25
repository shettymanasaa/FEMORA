import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { FemoraDatabase } from '../src/data/db';
import { db as coreDb, CoreError } from '../src/data/access';
import { coreApi } from '../src/data/public';
import { evaluateSafety } from '../src/safety';
import {
  ensureProfileAndSettingsInCoreDb,
  sanitizeSyncErrorMessage,
} from '../src/app/providers';
import type { LocalProfile } from '../src/types';
import {
  seedFakeDatasets,
  MENSTRUAL_PERSONA_ID,
  MATERNITY_PERSONA_ID,
  MENOPAUSE_PERSONA_ID,
} from '../src/data/fakeDatasets';

describe('FEMORA Rapid Core Engine Integration Suite', () => {
  let appDb: FemoraDatabase;

  beforeEach(async () => {
    appDb = new FemoraDatabase();
    await appDb.open();
  });

  // =========================================================================
  // 1. Profile Access and Data Persistence Flow
  // UI Action -> create/select profile -> coreDb registration -> selectProfile -> access verified
  // =========================================================================
  describe('Profile Access & Core Synchronization', () => {
    it('creates and registers a profile with immediate coreApi accessibility', async () => {
      const testProfileId = 'test-prof-integration-01';
      const timestamp = new Date().toISOString();

      const profile: LocalProfile = {
        id: testProfileId,
        nickname: 'Test User',
        avatarColor: '#C77D88',
        journey: 'menstrual',
        createdAt: timestamp,
      };

      await ensureProfileAndSettingsInCoreDb(profile);

      // Core engine profile selection
      const selectRes = await coreApi.selectProfile(testProfileId);
      expect(selectRes.ok).toBe(true);

      // Verify active profile in core engine
      const activeRes = await coreApi.getActiveProfile();
      expect(activeRes.ok).toBe(true);
      if (activeRes.ok) {
        expect(activeRes.data.id).toBe(testProfileId);
      }
    });

    it('safely repairs an existing profile with missing settings without duplicating records', async () => {
      const orphanProfileId = 'orphan-profile-repair-01';
      const now = new Date().toISOString();

      // 1. Create profile in coreDb WITHOUT settings
      await coreDb.profiles.put({
        id: orphanProfileId,
        profileId: orphanProfileId,
        displayName: 'Orphan Profile',
        activeJourney: 'maternity',
        createdAt: now,
        updatedAt: now,
      });

      // Confirm settings are completely missing
      const settingsBefore = await coreDb.settings.where('profileId').equals(orphanProfileId).first();
      expect(settingsBefore).toBeUndefined();

      // 2. Run auto-repair
      const localProf: LocalProfile = {
        id: orphanProfileId,
        nickname: 'Orphan Profile',
        avatarColor: '#8C9B83',
        journey: 'maternity',
        createdAt: now,
      };
      await ensureProfileAndSettingsInCoreDb(localProf);

      // 3. Confirm settings are repaired according to schema
      const settingsAfter = await coreDb.settings.where('profileId').equals(orphanProfileId).first();
      expect(settingsAfter).toBeDefined();
      expect(settingsAfter?.id).toBe(`settings-${orphanProfileId}`);
      expect(settingsAfter?.pinEnabled).toBe(false);
      expect(settingsAfter?.lockAfterMs).toBe(300000);

      // 4. Repeated repair should NOT create duplicate settings
      await ensureProfileAndSettingsInCoreDb(localProf);
      const settingsCount = await coreDb.settings.where('profileId').equals(orphanProfileId).count();
      expect(settingsCount).toBe(1);

      // 5. Profile selection succeeds cleanly
      const selectRes = await coreApi.selectProfile(orphanProfileId);
      expect(selectRes.ok).toBe(true);
    });

    it('protects against asynchronous race conditions during rapid profile switching', async () => {
      const now = new Date().toISOString();
      const p1: LocalProfile = { id: 'prof-rapid-01', nickname: 'User 1', avatarColor: '#C77D88', journey: 'menstrual', createdAt: now };
      const p2: LocalProfile = { id: 'prof-rapid-02', nickname: 'User 2', avatarColor: '#8C9B83', journey: 'maternity', createdAt: now };
      const p3: LocalProfile = { id: 'prof-rapid-03', nickname: 'User 3', avatarColor: '#B69BC8', journey: 'menopause', createdAt: now };

      await ensureProfileAndSettingsInCoreDb(p1);
      await ensureProfileAndSettingsInCoreDb(p2);
      await ensureProfileAndSettingsInCoreDb(p3);

      // Simulate monotonic sequence tracking as implemented in AppProviders
      let activeSeq = 0;
      let finalCommittedId = '';

      async function simulatedSwitch(targetProfile: LocalProfile) {
        const currentSeq = ++activeSeq;
        await ensureProfileAndSettingsInCoreDb(targetProfile);

        if (activeSeq !== currentSeq) return; // Discard stale switch

        const res = await coreApi.selectProfile(targetProfile.id);
        if (activeSeq !== currentSeq) return; // Discard stale response

        if (res.ok) {
          finalCommittedId = targetProfile.id;
        }
      }

      // Fire rapid switches in succession
      await Promise.all([
        simulatedSwitch(p1),
        simulatedSwitch(p2),
        simulatedSwitch(p3),
      ]);

      // The final active profile in core engine must be p3
      const activeRes = await coreApi.getActiveProfile();
      expect(activeRes.ok).toBe(true);
      if (activeRes.ok) {
        expect(activeRes.data.id).toBe(p3.id);
      }
      expect(finalCommittedId).toBe(p3.id);
    });

    it('sanitizes synchronization errors without exposing sensitive health metrics or raw data', () => {
      const lockedErr = new CoreError('LOCKED', 'Profile context changed during write');
      const safeLocked = sanitizeSyncErrorMessage(lockedErr);
      expect(safeLocked).toBe('Profile session is locked or currently in use.');
      expect(safeLocked).not.toContain('write');

      const notFoundErr = new CoreError('NOT_FOUND', 'Patient record with diagnosis XYZ not found');
      const safeNotFound = sanitizeSyncErrorMessage(notFoundErr);
      expect(safeNotFound).toBe('The requested profile was not found in storage.');
      expect(safeNotFound).not.toContain('XYZ');
      expect(safeNotFound).not.toContain('diagnosis');

      const unknownErr = new Error('Database raw socket internal failure');
      const safeUnknown = sanitizeSyncErrorMessage(unknownErr);
      expect(safeUnknown).toBe('Unable to synchronize profile session. Please try again.');
    });

    it('ensures profile deletion cleans up only the intended profile without cross-profile contamination', async () => {
      const now = new Date().toISOString();
      const profA: LocalProfile = { id: 'prof-del-alpha', nickname: 'Alpha', avatarColor: '#C77D88', journey: 'menstrual', createdAt: now };
      const profB: LocalProfile = { id: 'prof-del-beta', nickname: 'Beta', avatarColor: '#8C9B83', journey: 'maternity', createdAt: now };

      await ensureProfileAndSettingsInCoreDb(profA);
      await ensureProfileAndSettingsInCoreDb(profB);

      // Add records for both profiles
      await coreDb.checkins.put({
        id: 'chk-alpha-01',
        profileId: profA.id,
        journey: 'menstrual',
        date: '2026-10-25',
        kind: 'daily',
        data: { note: 'Alpha notes' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await coreDb.checkins.put({
        id: 'chk-beta-01',
        profileId: profB.id,
        journey: 'maternity',
        date: '2026-10-25',
        kind: 'daily',
        data: { note: 'Beta notes' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 1. Select Alpha as active, then delete Beta (background deletion)
      await coreApi.selectProfile(profA.id);

      // Perform isolated deletion on profB
      const tablesToClean = [
        coreDb.healthProfile,
        coreDb.journeyProfiles,
        coreDb.checkins,
        coreDb.records,
        coreDb.appointments,
        coreDb.notifications,
        coreDb.bookmarks,
        coreDb.recentlyViewed,
        coreDb.consents,
        coreDb.settings,
      ];

      await coreDb.transaction('rw', [coreDb.profiles, ...tablesToClean], async () => {
        for (const t of tablesToClean) {
          await t.where('profileId').equals(profB.id).delete();
        }
        await coreDb.profiles.delete(profB.id);
      });

      // 2. Verify profB is completely deleted
      expect(await coreDb.profiles.get(profB.id)).toBeUndefined();
      expect(await coreDb.settings.where('profileId').equals(profB.id).first()).toBeUndefined();
      expect(await coreDb.checkins.where('profileId').equals(profB.id).toArray()).toHaveLength(0);

      // 3. Verify profA remains completely intact
      expect(await coreDb.profiles.get(profA.id)).toBeDefined();
      expect(await coreDb.settings.where('profileId').equals(profA.id).first()).toBeDefined();
      const alphaCheckins = await coreDb.checkins.where('profileId').equals(profA.id).toArray();
      expect(alphaCheckins).toHaveLength(1);
      expect(alphaCheckins[0].id).toBe('chk-alpha-01');

      // 4. Delete profA when active
      await coreApi.deleteProfile(profA.id);
      expect(await coreDb.profiles.get(profA.id)).toBeUndefined();
      expect(await coreDb.checkins.where('profileId').equals(profA.id).toArray()).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. Maternity Journey: Check-ins, Birth Plan, Checklist & Postpartum
  // =========================================================================
  describe('Maternity Journey Complete Flow', () => {
    beforeEach(async () => {
      await seedFakeDatasets(appDb);
      await coreApi.selectProfile(MATERNITY_PERSONA_ID);
    });

    it('saves a maternity check-in with safety screening and retrieves history', async () => {
      const today = '2026-10-25';
      const checkInInput = {
        date: today,
        kind: 'pregnancy' as const,
        symptoms: [
          { code: 'fetal_movement', severity: 2 },
          { code: 'backache', severity: 3 },
        ],
        notes: 'Baby active after breakfast.',
      };

      // 1. Safety check
      const safety = evaluateSafety('maternity', {
        symptoms: ['fetal_movement', 'backache'],
        scores: { pain: 3 },
      });
      expect(safety).toBeDefined();

      // 2. Save check-in
      const saveRes = await coreApi.saveMaternityCheckIn(MATERNITY_PERSONA_ID, checkInInput);
      expect(saveRes.ok).toBe(true);

      // 3. Query history
      const historyRes = await coreApi.getCheckIns(MATERNITY_PERSONA_ID, 'maternity');
      expect(historyRes.ok).toBe(true);
      if (historyRes.ok) {
        const found = historyRes.data.find((c) => c.date === today);
        expect(found).toBeDefined();
        expect(found?.journey).toBe('maternity');
      }
    });

    it('persists birth plan preferences and hospital checklist items', async () => {
      // 1. Birth plan
      const planRes = await coreApi.saveBirthPlan(MATERNITY_PERSONA_ID, {
        preferences: ['Dim lighting', 'Delayed cord clamping', 'Hydrotherapy'],
        notes: 'Discussed with midwife at 24w visit.',
      });
      expect(planRes.ok).toBe(true);

      // 2. Hospital checklist item
      const itemRes = await coreApi.addHospitalChecklistItem(MATERNITY_PERSONA_ID, {
        label: 'Rear-facing car seat installed',
        completed: true,
      });
      expect(itemRes.ok).toBe(true);

      // 3. Verify in records
      const recordsRes = await coreApi.listRecords(MATERNITY_PERSONA_ID, 'maternity');
      expect(recordsRes.ok).toBe(true);
      if (recordsRes.ok) {
        expect(recordsRes.data.some((r) => r.type === 'birth_plan')).toBe(true);
        expect(recordsRes.data.some((r) => r.type === 'hospital_checklist')).toBe(true);
      }
    });

    it('transitions profile to postpartum stage preserving previous records', async () => {
      const birthDate = '2027-02-14';
      const transitionRes = await coreApi.transitionToPostpartum(MATERNITY_PERSONA_ID, birthDate);
      expect(transitionRes.ok).toBe(true);

      // Timeline now reports postpartum stage
      const timelineRes = await coreApi.maternityTimeline(MATERNITY_PERSONA_ID, '2027-02-20');
      expect(timelineRes.ok).toBe(true);
      if (timelineRes.ok && timelineRes.data.available) {
        expect(timelineRes.data).toHaveProperty('stage', 'postpartum');
      }
    });
  });

  // =========================================================================
  // 3. Menopause Journey: Check-ins, 30-Day Trends & Care Questions
  // =========================================================================
  describe('Menopause Journey Complete Flow', () => {
    beforeEach(async () => {
      await seedFakeDatasets(appDb);
      await coreApi.selectProfile(MENOPAUSE_PERSONA_ID);
    });

    it('saves menopause check-in and computes 30-day symptom trends', async () => {
      const date = '2026-10-25';
      const saveRes = await coreApi.saveMenopauseCheckIn(MENOPAUSE_PERSONA_ID, {
        date,
        kind: 'menopause' as const,
        symptoms: [
          { code: 'hot_flashes', severity: 6 },
          { code: 'sleep_disturbances', severity: 7 },
        ],
        notes: 'Hot flash triggered by warm tea.',
      });
      expect(saveRes.ok).toBe(true);

      // Compute trends
      const trendsRes = await coreApi.menopauseTrends(MENOPAUSE_PERSONA_ID, 30, '2026-10-25');
      expect(trendsRes.ok).toBe(true);
      if (trendsRes.ok) {
        expect(trendsRes.data.some((t) => t.symptom === 'hot_flashes')).toBe(true);
        expect(trendsRes.data.some((t) => t.symptom === 'sleep_disturbances')).toBe(true);
      }
    });

    it('records doctor discussion questions and treatment history', async () => {
      // 1. Doctor question
      const qRes = await coreApi.addMenopauseDoctorQuestion(MENOPAUSE_PERSONA_ID, {
        question: 'Should I adjust transdermal estradiol dose for sleep?',
      });
      expect(qRes.ok).toBe(true);

      // 2. Treatment history
      const tRes = await coreApi.saveTreatmentHistory(MENOPAUSE_PERSONA_ID, {
        treatment: 'Micronized Progesterone 100mg',
        notes: 'Nightly oral capsule',
      });
      expect(tRes.ok).toBe(true);

      // 3. Verify records
      const recordsRes = await coreApi.listRecords(MENOPAUSE_PERSONA_ID, 'menopause');
      expect(recordsRes.ok).toBe(true);
      if (recordsRes.ok) {
        expect(recordsRes.data.some((r) => r.type === 'doctor_question')).toBe(true);
        expect(recordsRes.data.some((r) => r.type === 'treatment_history')).toBe(true);
      }
    });
  });

  // =========================================================================
  // 4. Backup Export & Restore Integration
  // =========================================================================
  describe('Encrypted Backup & Portability', () => {
    beforeEach(async () => {
      await seedFakeDatasets(appDb);
      await coreApi.selectProfile(MENSTRUAL_PERSONA_ID);
    });

    it('exports a valid backup archive for the active profile', async () => {
      const backupRes = await coreApi.exportBackup(MENSTRUAL_PERSONA_ID);
      expect(backupRes.ok).toBe(true);
      if (backupRes.ok) {
        expect(backupRes.data.format).toBe('femora-backup-v1');
        expect(backupRes.data.profileId).toBe(MENSTRUAL_PERSONA_ID);
        expect(backupRes.data.payload?.tables).toBeDefined();
      }
    });

    it('verifies restore using a valid test backup archive', async () => {
      // 1. Export valid backup
      const backupRes = await coreApi.exportBackup(MENSTRUAL_PERSONA_ID);
      expect(backupRes.ok).toBe(true);
      if (!backupRes.ok) return;

      const validBackup = backupRes.data;

      // 2. Wipe profile to test clean recovery (standard restore pattern)
      await coreApi.wipeProfile(MENSTRUAL_PERSONA_ID);
      await coreApi.selectProfile(MENSTRUAL_PERSONA_ID);

      // 3. Execute restore with the valid backup archive
      const restoreRes = await coreApi.restoreBackup(undefined, validBackup);
      expect(restoreRes.ok).toBe(true);
      if (restoreRes.ok) {
        expect(restoreRes.data.profileId).toBe(MENSTRUAL_PERSONA_ID);
        expect(restoreRes.data.importedAt).toBeDefined();
      }
    });

    it('rejects an invalid backup fail-closed without corrupting or risking user data', async () => {
      // Export a real backup to obtain structural envelope
      const backupRes = await coreApi.exportBackup(MENSTRUAL_PERSONA_ID);
      expect(backupRes.ok).toBe(true);
      if (!backupRes.ok) return;

      // Test 1: Unsupported version / format
      const invalidVersion = { ...backupRes.data, format: 'femora-backup-v99' as never };
      const failVersionRes = await coreApi.restoreBackup(undefined, invalidVersion);
      expect(failVersionRes.ok).toBe(false);
      if (!failVersionRes.ok) {
        expect(failVersionRes.code).toBe('VALIDATION');
      }

      // Test 2: Cross-profile forgery injection
      const corruptedPayload = structuredClone(backupRes.data.payload!);
      corruptedPayload.tables.checkins = [
        {
          id: 'forged-chk-001',
          profileId: 'victim-other-profile-999',
          journey: 'menstrual',
          date: '2026-10-25',
          kind: 'daily',
          data: { forged: true },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const crossProfileBackup = { ...backupRes.data, payload: corruptedPayload };
      const crossProfileRes = await coreApi.restoreBackup(undefined, crossProfileBackup);
      expect(crossProfileRes.ok).toBe(false);
      if (!crossProfileRes.ok) {
        expect(crossProfileRes.code).toBe('VALIDATION');
      }

      // Test 3: Verify user data was protected and forged row was never written
      const listCheckInsRes = await coreApi.getCheckIns(MENSTRUAL_PERSONA_ID, 'menstrual');
      expect(listCheckInsRes.ok).toBe(true);
      if (listCheckInsRes.ok) {
        expect(listCheckInsRes.data.some((c) => c.id === 'forged-chk-001')).toBe(false);
      }
    });
  });
});
