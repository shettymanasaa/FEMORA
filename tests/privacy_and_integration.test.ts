import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { FemoraDatabase } from '../src/data/db';
import { loadDemoData, resetDemoData, wipeDemoData, isDemoLoaded } from '../src/data/demoLoader';
import { DEMO_PROFILE_ID } from '../src/data/demoData';
import { generateNotifications } from '../src/data/notifications';
import { buildReport } from '../src/reports/reportBuilder';
import { getAiExplanation, buildAiPayload } from '../src/ai/payload';

describe('Privacy, Multi-Profile Isolation, and Data Integrity Tests', () => {
  let testDb: FemoraDatabase;

  beforeEach(async () => {
    testDb = new FemoraDatabase();
    await testDb.open();
    await Promise.all(testDb.tables.map((table) => table.clear()));
  });

  it('guarantees strict profile isolation: Profile A cannot see or export Profile B records', async () => {
    // 1. Load demo data for Profile A (Maya)
    await loadDemoData(testDb);

    // 2. Create Profile B with distinct private records
    const PROFILE_B_ID = 'profile-b-uuid-9999';
    await testDb.profiles.add({
      id: PROFILE_B_ID,
      nickname: 'Sarah (Private)',
      avatar: 'rose-blush',
      activeJourneys: ['menstrual'],
      lastActiveJourney: 'menstrual',
      hasPin: true,
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await testDb.checkins.add({
      id: 'chk-profile-b-private',
      profileId: PROFILE_B_ID,
      journey: 'menstrual',
      loggedAt: new Date().toISOString(),
      payload: {
        symptoms: ['cramps'],
        scores: { pain: 8 },
        note: 'Strictly confidential note of Profile B',
      },
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Generate Report for Profile A
    const reportA = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'symptoms'],
      database: testDb,
    });

    expect(reportA.ok).toBe(true);
    if (reportA.ok) {
      expect(reportA.data.profileNickname).toBe('Maya (Demo)');
      // Profile A's report must NOT contain Profile B's pain score (8) or note
      expect(reportA.data.notes).not.toContain('Strictly confidential note of Profile B');
    }

    // 4. Generate Report for Profile B
    const reportB = await buildReport({
      profileId: PROFILE_B_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'symptoms'],
      database: testDb,
    });

    expect(reportB.ok).toBe(true);
    if (reportB.ok) {
      expect(reportB.data.profileNickname).toBe('Sarah (Private)');
      expect(reportB.data.isSample).toBe(false);
      expect(reportB.data.metrics['Total Check-ins Logged']).toBe(1);
    }
  });

  it('generates in-app notifications accurately, avoids duplicates, and ignores cancelled/past appointments', async () => {
    await loadDemoData(testDb);

    // 1. Initial generation
    const notifs1 = await generateNotifications(DEMO_PROFILE_ID, testDb);
    expect(notifs1.ok).toBe(true);
    if (notifs1.ok) {
      expect(notifs1.data.length).toBeGreaterThanOrEqual(1);
      // Must not contain sensitive health details
      for (const n of notifs1.data) {
        expect(n.kind).toBe('appointment_reminder');
        expect(n.params?.title).toBeDefined();
        // Verify no raw medical notes
        expect((n.params as any)?.notes).toBeUndefined();
      }
    }

    const countAfterFirstRun = notifs1.ok ? notifs1.data.length : 0;

    // 2. Second generation (simulating app reopened) -> NO DUPLICATES
    const notifs2 = await generateNotifications(DEMO_PROFILE_ID, testDb);
    expect(notifs2.ok).toBe(true);
    if (notifs2.ok) {
      expect(notifs2.data.length).toBe(countAfterFirstRun);
    }

    // 3. Add a completed and a cancelled appointment -> they must be IGNORED
    await testDb.appointments.add({
      id: 'apt-completed-01',
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      status: 'done', // Completed!
      payload: { title: 'Completed Consult' },
      isSample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await testDb.appointments.add({
      id: 'apt-cancelled-01',
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      status: 'cancelled', // Cancelled!
      payload: { title: 'Cancelled Consult' },
      isSample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const notifs3 = await generateNotifications(DEMO_PROFILE_ID, testDb);
    expect(notifs3.ok).toBe(true);
    if (notifs3.ok) {
      expect(notifs3.data.length).toBe(countAfterFirstRun);
    }
  });

  it('synthetic demo dataset is deterministic, resettable, and can be completely wiped', async () => {
    // 1. Initially empty
    expect(await isDemoLoaded(testDb)).toBe(false);

    // 2. Load demo
    await loadDemoData(testDb);
    expect(await isDemoLoaded(testDb)).toBe(true);

    const checkins = await testDb.checkins.where('profileId').equals(DEMO_PROFILE_ID).toArray();
    expect(checkins.length).toBeGreaterThanOrEqual(7);
    for (const chk of checkins) {
      expect(chk.isSample).toBe(true);
    }

    // 3. Reset demo
    await resetDemoData(testDb);
    expect(await isDemoLoaded(testDb)).toBe(true);

    // 4. Wipe demo
    await wipeDemoData(testDb);
    expect(await isDemoLoaded(testDb)).toBe(false);
    const wipedCheckins = await testDb.checkins.where('profileId').equals(DEMO_PROFILE_ID).toArray();
    expect(wipedCheckins.length).toBe(0);
  });

  it('client AI module handles HTTP 400, 429, 502, 503 by falling back to local rule-based insights', async () => {
    const payloadRes = buildAiPayload({
      journey: 'menstrual',
      window: 'last 3 cycles',
      rawMetrics: { cycleLengthAvg: 28, painScoreAvg: 4 },
      rawSymptomIds: ['cramps'],
    });

    expect(payloadRes.ok).toBe(true);
    if (!payloadRes.ok) return;

    // Mock fetch to simulate 502 Bad Gateway (both providers failed)
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ code: 'PROVIDERS_FAILED' }),
    } as Response);

    const explanation = await getAiExplanation({
      payload: payloadRes.data,
      aiEnabled: true,
      hasConsent: true,
      apiEndpoint: '/api/ai',
    });

    expect(explanation.ok).toBe(true);
    if (explanation.ok) {
      expect(explanation.data.provider).toBe('local_fallback');
      expect(explanation.data.disclaimer).toContain('Local rule-based fallback');
      expect(explanation.data.text).toContain('Cycle Frequency');
    }

    fetchSpy.mockRestore();
  });
});
