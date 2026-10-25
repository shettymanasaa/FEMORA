import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { FemoraDatabase } from '../src/data/db';
import { loadDemoData } from '../src/data/demoLoader';
import { DEMO_PROFILE_ID } from '../src/data/demoData';
import { buildReport } from '../src/reports/reportBuilder';
import { generateReportPdfBlob, shareReport } from '../src/reports/reportActions';

describe('Report Generation & PDF Export Tests', () => {
  let testDb: FemoraDatabase;

  beforeEach(async () => {
    testDb = new FemoraDatabase();
    await testDb.open();
    await loadDemoData(testDb);
  });

  it('builds a valid Menstrual Health Report from saved records', async () => {
    const result = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'symptoms', 'trends', 'appointments'],
      database: testDb,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const report = result.data;
      expect(report.reportType).toBe('menstrual');
      expect(report.journey).toBe('menstrual');
      expect(report.profileNickname).toBe('Maya (Demo)');
      expect(report.isSample).toBe(true);
      expect(report.metrics['Total Check-ins Logged']).toBeGreaterThan(0);
      expect(report.symptomsSummary.length).toBeGreaterThan(0);
      expect(report.disclaimer).toContain('NOT a medical diagnosis');
      // Sexual wellbeing must NOT be included by default!
      expect(report.sexualWellbeingSection).toBeUndefined();
    }
  });

  it('builds a valid Maternity & Postpartum Report', async () => {
    const result = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'maternity',
      periodLabel: 'Current Trimester',
      sections: ['summary', 'symptoms', 'trends'],
      database: testDb,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const report = result.data;
      expect(report.reportType).toBe('maternity');
      expect(report.metrics['Gestational Stage']).toBe('Week 32');
      expect(report.metrics['Care Provider']).toBe('St. Jude Midwifery Center');
    }
  });

  it('builds a valid Menopause Report', async () => {
    const result = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menopause',
      periodLabel: 'Last 4 Weeks',
      sections: ['summary', 'symptoms', 'trends'],
      database: testDb,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const report = result.data;
      expect(report.reportType).toBe('menopause');
      expect(report.metrics['Reported Stage']).toBe('perimenopause');
      expect(report.metrics).toHaveProperty('Recorded Vasomotor Episodes');
    }
  });

  it('filters saved check-ins accurately by date range', async () => {
    // Range that only includes Oct 15 - Oct 25, 2026
    const result = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Mid-October 2026',
      startDate: '2026-10-15T00:00:00.000Z',
      endDate: '2026-10-25T23:59:59.000Z',
      sections: ['summary', 'symptoms'],
      database: testDb,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Demo menstrual checkins: Oct 4, Oct 5, Oct 18
      // Only Oct 18 is within range!
      expect(result.data.metrics['Total Check-ins Logged']).toBe(1);
    }
  });

  it('allows optional sections to be excluded', async () => {
    const result = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary'], // 'appointments' and 'trends' excluded
      database: testDb,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sectionsIncluded).toEqual(['summary']);
      expect(result.data.appointments).toBeUndefined();
    }
  });

  it('excludes Sexual Wellbeing by default, and includes it ONLY with explicit consent', async () => {
    // 1. Default call without includeSexualWellbeing
    const defaultResult = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'sexual_wellbeing'],
      database: testDb,
    });
    expect(defaultResult.ok).toBe(true);
    if (defaultResult.ok) {
      expect(defaultResult.data.sexualWellbeingSection).toBeUndefined();
    }

    // 2. Explicit call with includeSexualWellbeing: true
    const explicitResult = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'sexual_wellbeing'],
      includeSexualWellbeing: true,
      database: testDb,
    });
    expect(explicitResult.ok).toBe(true);
    if (explicitResult.ok) {
      expect(explicitResult.data.sexualWellbeingSection).toBeDefined();
      expect(explicitResult.data.sexualWellbeingSection?.recordsCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('generates a valid PDF blob using @react-pdf/renderer', async () => {
    const reportRes = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'symptoms', 'trends'],
      database: testDb,
    });

    expect(reportRes.ok).toBe(true);
    if (reportRes.ok) {
      const blob = await generateReportPdfBlob(reportRes.data);
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(500); // Valid PDF blob contains bytes
    }
  });

  it('shareReport invokes native share sheet only on explicit call and falls back gracefully', async () => {
    const reportRes = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'maternity',
      periodLabel: 'Current Trimester',
      sections: ['summary'],
      database: testDb,
    });

    expect(reportRes.ok).toBe(true);
    if (reportRes.ok) {
      // When navigator.share is unavailable, falls back to download
      const shareResult = await shareReport(reportRes.data);
      expect(shareResult.ok).toBe(true);
      if (shareResult.ok) {
        expect(['web_share', 'download_fallback']).toContain(shareResult.data.method);
      }
    }
  });
});
