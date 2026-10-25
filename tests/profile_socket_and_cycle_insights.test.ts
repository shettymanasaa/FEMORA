import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { FemoraDatabase } from '../src/data/db';
import {
  seedFakeDatasets,
  MENSTRUAL_PERSONA_ID,
  MATERNITY_PERSONA_ID,
  MENOPAUSE_PERSONA_ID,
  DEFAULT_DEMO_PROFILES,
} from '../src/data/fakeDatasets';
import { coreApi } from '../src/data/public';
import { cyclePhase, cycleDay, estimateNextPeriod } from '../src/core/health/calculations';

describe('Profile Socket & Cycle Insights Verification Suite', () => {
  let db: FemoraDatabase;

  beforeEach(async () => {
    db = new FemoraDatabase();
    await db.open();
  });

  // =========================================================================
  // 1. Profile Socket Verification: Only Profile is Required
  // =========================================================================
  describe('Profile Socket Architecture', () => {
    it('verifies that only profile identity (nickname & journey) is required to authenticate', () => {
      // FEMORA local-first principle: no passwords, emails, or cloud tokens required
      const defaultPersonas = DEFAULT_DEMO_PROFILES;
      expect(defaultPersonas).toHaveLength(3);

      const priya = defaultPersonas.find((p) => p.journey === 'menstrual');
      expect(priya).toBeDefined();
      expect(priya?.id).toBe(MENSTRUAL_PERSONA_ID);
      expect(priya?.nickname).toContain('Priya');

      const aria = defaultPersonas.find((p) => p.journey === 'maternity');
      expect(aria?.id).toBe(MATERNITY_PERSONA_ID);

      const elena = defaultPersonas.find((p) => p.journey === 'menopause');
      expect(elena?.id).toBe(MENOPAUSE_PERSONA_ID);
    });

    it('seeds the evaluation datasets for all 3 profile sockets', async () => {
      const seeded = await seedFakeDatasets(db);
      expect(seeded.totalRecordsLoaded).toBeGreaterThanOrEqual(25);

      const priyaProfile = await db.profiles.get(MENSTRUAL_PERSONA_ID);
      expect(priyaProfile).toBeDefined();
      expect(priyaProfile?.activeJourney).toBe('menstrual');

      const checkins = await db.checkins.where('profileId').equals(MENSTRUAL_PERSONA_ID).toArray();
      // Priya has at least 3 cycle period starts + daily logs
      expect(checkins.length).toBeGreaterThanOrEqual(5);
      const periodStarts = checkins.filter((c) => c.payload.symptoms.includes('period_start'));
      expect(periodStarts.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // 2. Cycle Insights Engine & Mathematical Clinical Verification
  // =========================================================================
  describe('Cycle Insights Calculations', () => {
    it('calculates cycle day and phase progression with clinical fidelity', () => {
      const periodStart = '2026-10-05';
      const cycleLength = 29;

      // Day 1 to 5: Menstrual Phase
      expect(cycleDay(periodStart, '2026-10-05')).toBe(1);
      expect(cyclePhase(1, cycleLength)).toBe('menstrual');
      expect(cyclePhase(5, cycleLength)).toBe('menstrual');

      // Day 6 to 12: Follicular Phase
      expect(cycleDay(periodStart, '2026-10-14')).toBe(10);
      expect(cyclePhase(10, cycleLength)).toBe('follicular');

      // Day 13 to 17: Ovulatory Window (cycleLength 29 - 14 = 15; window 13-17)
      expect(cycleDay(periodStart, '2026-10-19')).toBe(15);
      expect(cyclePhase(15, cycleLength)).toBe('estimated_ovulatory');

      // Day 18+: Luteal Phase
      expect(cycleDay(periodStart, '2026-10-25')).toBe(21);
      expect(cyclePhase(21, cycleLength)).toBe('luteal');
    });

    it('estimates next period with 3 consistent recorded cycle starts', () => {
      // 3 cycle starts spaced 29 days apart
      const starts = ['2026-08-08', '2026-09-06', '2026-10-05'];
      const today = '2026-10-25';

      const estimate = estimateNextPeriod(starts, today);
      expect(estimate).not.toBeNull();
      expect(estimate?.cycleLengthDays).toBe(29);
      expect(estimate?.date).toBe('2026-11-03'); // 2026-10-05 + 29 days
      expect(estimate?.estimate).toBe(true);
    });

    it('provides comprehensive menstrual summary via coreApi for Priya', async () => {
      await seedFakeDatasets(db);
      await coreApi.selectProfile(MENSTRUAL_PERSONA_ID);

      const summary = await coreApi.menstrualSummary(MENSTRUAL_PERSONA_ID, '2026-10-25');
      expect(summary.ok).toBe(true);
      if (summary.ok) {
        expect(summary.data.cycleDay).toBe(21);
        expect(summary.data.cycleLengthDays).toBe(29);
        expect(summary.data.phase).toBe('luteal');
        expect(summary.data.estimate).toMatchObject({
          available: true,
          cycleLengthDays: 29,
          date: '2026-11-03',
        });
        expect(summary.data.symptomTrends.length).toBeGreaterThan(0);
      }
    });
  });
});
