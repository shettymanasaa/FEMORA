import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { FemoraDatabase } from '../src/data/db';
import { loadDemoData } from '../src/data/demoLoader';
import { DEMO_PROFILE_ID } from '../src/data/demoData';
import { buildReport } from '../src/reports/reportBuilder';
import { generateReportPdfBlob } from '../src/reports/reportActions';

describe('Deep Verification of All 3 PDF Reports against Saved Records', () => {
  let db: FemoraDatabase;

  beforeEach(async () => {
    db = new FemoraDatabase();
    await db.open();
    await Promise.all(db.tables.map((t) => t.clear()));
    await loadDemoData(db);
  });

  it('Verifies Menstrual Health Report accurately reflects saved records', async () => {
    const res = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menstrual',
      periodLabel: 'Last 30 Days',
      sections: ['summary', 'symptoms', 'trends', 'appointments'],
      database: db,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const data = res.data;
    expect(data.reportType).toBe('menstrual');
    expect(data.journey).toBe('menstrual');
    expect(data.profileNickname).toBe('Maya (Demo)');
    expect(data.isSample).toBe(true);

    // Check exact metrics from demo data
    expect(data.metrics['Total Check-ins Logged']).toBe(3); // chk-demo-m-01, 02, 03
    expect(data.metrics['Typical Cycle Length']).toBe('28 days');
    expect(data.metrics['Typical Bleeding Length']).toBe('5 days');

    // Symptoms verification
    const symptomNames = data.symptomsSummary.map((s) => s.symptomId);
    expect(symptomNames).toContain('cramps');
    expect(symptomNames).toContain('bloating');

    // PDF generation
    const pdfBlob = await generateReportPdfBlob(data);
    expect(pdfBlob).toBeDefined();
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(1000);
  });

  it('Verifies Maternity & Postpartum Report accurately reflects saved records', async () => {
    const res = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'maternity',
      periodLabel: 'Current Trimester',
      sections: ['summary', 'symptoms', 'trends', 'appointments'],
      database: db,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const data = res.data;
    expect(data.reportType).toBe('maternity');
    expect(data.journey).toBe('maternity');
    expect(data.metrics['Gestational Stage']).toBe('Week 32');
    expect(data.metrics['Care Provider']).toBe('St. Jude Midwifery Center');
    expect(data.metrics['Estimated Due Date']).toBe('2026-12-18');

    // Check symptoms
    const symptomNames = data.symptomsSummary.map((s) => s.symptomId);
    expect(symptomNames).toContain('fatigue');

    // PDF generation
    const pdfBlob = await generateReportPdfBlob(data);
    expect(pdfBlob).toBeDefined();
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(1000);
  });

  it('Verifies Menopause Report accurately reflects saved records', async () => {
    const res = await buildReport({
      profileId: DEMO_PROFILE_ID,
      journey: 'menopause',
      periodLabel: 'Last 4 Weeks',
      sections: ['summary', 'symptoms', 'trends'],
      database: db,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const data = res.data;
    expect(data.reportType).toBe('menopause');
    expect(data.journey).toBe('menopause');
    expect(data.metrics['Reported Stage']).toBe('perimenopause');
    expect(data.metrics['Recorded Vasomotor Episodes']).toBe(2); // hot flashes in 2 checkins

    // Symptoms
    const symptomNames = data.symptomsSummary.map((s) => s.symptomId);
    expect(symptomNames).toContain('hot_flashes');
    expect(symptomNames).toContain('insomnia');

    // PDF generation
    const pdfBlob = await generateReportPdfBlob(data);
    expect(pdfBlob).toBeDefined();
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(1000);
  });
});
