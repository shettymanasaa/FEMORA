import { db, FemoraDatabase } from '../data/db';
import {
  Journey,
  ReportData,
  ReportType,
  Result,
  Checkin,
  RecordItem,
} from '../types';

export const AVAILABLE_REPORT_SECTIONS = [
  { id: 'summary', title: 'Executive Health Summary & Metrics', isOptional: false },
  { id: 'symptoms', title: 'Symptom Frequencies & Severity', isOptional: false },
  { id: 'trends', title: 'Pattern & Trend Analysis', isOptional: true },
  { id: 'appointments', title: 'Relevant Clinical Encounters', isOptional: true },
  { id: 'ai_explanation', title: 'AI-Generated Trend Explanation (Grounding)', isOptional: true },
  { id: 'sexual_wellbeing', title: 'Sexual Wellbeing Log (Confidential)', isOptional: true },
];

export interface BuildReportOptions {
  profileId: string;
  journey?: Journey;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  sections?: string[];
  includeSexualWellbeing?: boolean;
  aiExplanationText?: string;
  database?: FemoraDatabase;
}

export type GenerateReportOptions = BuildReportOptions;

export async function buildReport(
  options: BuildReportOptions,
  dbParam?: FemoraDatabase
): Promise<Result<ReportData>> {
  try {
    const database = dbParam || options.database || db;
    const { profileId } = options;

    // 1. Fetch Profile
    const profile = await database.profiles.get(profileId);
    if (!profile) {
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: `Profile with ID "${profileId}" not found.`,
      };
    }

    const journey: Journey =
      options.journey || profile.lastActiveJourney || 'menstrual';
    const periodLabel = options.periodLabel || 'Past 30 Days Summary';

    // Parse date window
    const nowMs = Date.now();
    const startFilter = options.startDate
      ? new Date(options.startDate).getTime()
      : nowMs - 30 * 86400000;
    const endFilter = options.endDate
      ? new Date(options.endDate).getTime()
      : nowMs;

    // 2. Fetch Checkins
    const allCheckins: Checkin[] = await database.checkins
      .where('profileId')
      .equals(profileId)
      .toArray();

    const filteredCheckins = allCheckins.filter((c) => {
      if (c.journey !== journey) return false;
      const t = new Date(c.loggedAt).getTime();
      return t >= startFilter && t <= endFilter;
    });

    // 3. Fetch Records & Appointments
    const allRecords: RecordItem[] = await database.records
      .where('profileId')
      .equals(profileId)
      .toArray();

    const filteredRecords = allRecords.filter((r) => {
      if (r.journey !== journey) return false;
      const t = new Date(r.loggedAt).getTime();
      return t >= startFilter && t <= endFilter;
    });

    const settings = await database.settings.get(profileId);

    // Default sections if none supplied
    const defaultSections = [
      'metrics',
      'symptoms',
      'trends',
      'appointments',
      'summary',
    ];
    const sections = options.sections || defaultSections;

    const allAppointments = await database.appointments
      .where('profileId')
      .equals(profileId)
      .toArray();

    const filteredAppointments = allAppointments.filter((apt) => {
      if (apt.journey && apt.journey !== journey) return false;
      const t = new Date(apt.startsAt || apt.date || '').getTime();
      return t >= startFilter && t <= endFilter;
    });

    // 4. Calculate Aggregate Metrics (No invented data)
    const metrics: Record<string, number | string> = {};
    metrics['Total Check-ins Logged'] = filteredCheckins.length;

    let totalPain = 0;
    let painEntriesCount = 0;
    const symptomCounts: Record<string, { count: number; totalScore: number; scoreEntries: number }> = {};

    for (const chk of filteredCheckins) {
      const payload = chk.payload;
      if (payload.scores && typeof payload.scores.pain === 'number') {
        totalPain += payload.scores.pain;
        painEntriesCount += 1;
      }

      for (const sym of payload.symptoms || []) {
        if (!symptomCounts[sym]) {
          symptomCounts[sym] = { count: 0, totalScore: 0, scoreEntries: 0 };
        }
        symptomCounts[sym].count += 1;
        if (payload.scores && typeof payload.scores[sym] === 'number') {
          symptomCounts[sym].totalScore += payload.scores[sym];
          symptomCounts[sym].scoreEntries += 1;
        }
      }
    }

    if (painEntriesCount > 0) {
      metrics['Average Discomfort Score (0–10)'] = (
        totalPain / painEntriesCount
      ).toFixed(1);
    }

    // Journey-specific metric derivations
    if (journey === 'menstrual') {
      const journeyProfile = await database.journeyProfiles
        .where('[profileId+journey]')
        .equals([profileId, 'menstrual'])
        .first();

      if (journeyProfile?.payload?.typicalCycleLengthDays) {
        metrics['Typical Cycle Length'] = `${journeyProfile.payload.typicalCycleLengthDays} days`;
      }
      if (journeyProfile?.payload?.typicalPeriodLengthDays) {
        metrics['Typical Bleeding Length'] = `${journeyProfile.payload.typicalPeriodLengthDays} days`;
      }
    } else if (journey === 'maternity') {
      const journeyProfile = await database.journeyProfiles
        .where('[profileId+journey]')
        .equals([profileId, 'maternity'])
        .first();

      if (journeyProfile?.payload?.pregnancyWeek) {
        metrics['Gestational Stage'] = `Week ${journeyProfile.payload.pregnancyWeek}`;
      }
      if (journeyProfile?.payload?.dueDate) {
        metrics['Estimated Due Date'] = String(journeyProfile.payload.dueDate).slice(0, 10);
      }
      if (journeyProfile?.payload?.careProvider) {
        metrics['Care Provider'] = String(journeyProfile.payload.careProvider);
      }
    } else if (journey === 'menopause') {
      const journeyProfile = await database.journeyProfiles
        .where('[profileId+journey]')
        .equals([profileId, 'menopause'])
        .first();

      if (journeyProfile?.payload?.stage) {
        metrics['Reported Stage'] = String(journeyProfile.payload.stage);
      }
      const hotFlashCount = symptomCounts['hot_flashes']?.count || 0;
      metrics['Recorded Vasomotor Episodes'] = hotFlashCount;
    }

    // 5. Symptoms Summary
    const symptomsSummary: ReportData['symptomsSummary'] = Object.entries(
      symptomCounts
    )
      .map(([symptomId, data]) => ({
        symptomId,
        name: symptomId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count: data.count,
        avgScore:
          data.scoreEntries > 0
            ? Number((data.totalScore / data.scoreEntries).toFixed(1))
            : undefined,
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Clinical Trends Synthesized Strictly from Facts
    const trends: ReportData['trends'] = [];

    if (filteredCheckins.length >= 3) {
      const topSymptoms = symptomsSummary.slice(0, 3);
      if (topSymptoms.length > 0) {
        trends.push({
          period: periodLabel,
          summary: `Primary logged indicators: ${topSymptoms
            .map((s) => `${s.name} (${s.count} logs${s.avgScore ? `, avg score ${s.avgScore}` : ''})`)
            .join('; ')}.`,
        });
      }
    } else {
      trends.push({
        period: periodLabel,
        summary: 'Provisional baseline: limited check-in logs recorded in this period.',
      });
    }

    // 7. Appointments (Only if section selected)
    const appointmentsList = sections.includes('appointments')
      ? filteredAppointments.map((apt) => ({
          date: (apt.startsAt || apt.date || '').slice(0, 10),
          title: apt.payload?.title || apt.title || 'Appointment',
          status: (apt.status || 'upcoming') as string,
        }))
      : undefined;

    // 8. Notes (Only non-sensitive note snippets if explicitly selected)
    const notes = sections.includes('summary')
      ? filteredCheckins
          .filter((c) => c.payload.note)
          .map((c) => c.payload.note as string)
          .slice(0, 3)
      : undefined;

    // 9. Sexual Wellbeing Section (CONFIDENTIAL - Only if explicitly permitted and opted in!)
    let sexualWellbeingSection: ReportData['sexualWellbeingSection'] | undefined;
    const canIncludeSexWellbeing =
      options.includeSexualWellbeing === true &&
      settings?.sexualWellbeingVisible === true &&
      sections.includes('sexual_wellbeing');

    if (canIncludeSexWellbeing) {
      const sexRecords = filteredRecords.filter(
        (r) => r.type === 'sexual_wellbeing'
      );
      sexualWellbeingSection = {
        recordsCount: sexRecords.length,
        summary: `${sexRecords.length} confidential sexual wellbeing entries recorded during this reporting interval.`,
      };
    }

    // 10. AI Explanation (Only if section selected and supplied)
    const aiExplanation =
      sections.includes('ai_explanation') && options.aiExplanationText
        ? options.aiExplanationText
        : undefined;

    const reportTypeMap: Record<Journey, ReportType> = {
      menstrual: 'menstrual',
      maternity: 'maternity',
      menopause: 'menopause',
    };

    const reportData: ReportData = {
      reportType: reportTypeMap[journey],
      journey,
      periodLabel,
      dateRange: {
        start: options.startDate
          ? options.startDate.slice(0, 10)
          : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        end: options.endDate
          ? options.endDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      },
      generatedAt: new Date().toISOString(),
      profileNickname: profile.nickname || profile.displayName || 'Profile',
      isSample: Boolean(profile.isSample),
      metrics,
      symptomsSummary,
      trends,
      appointments: appointmentsList,
      notes,
      aiExplanation,
      sexualWellbeingSection,
      sectionsIncluded: [...sections],
      disclaimer:
        'This clinical consultation report was compiled on-device by FEMORA to support healthcare discussions. It is NOT a medical diagnosis or treatment plan. Always consult a qualified physician or healthcare provider for diagnosis and clinical treatment.',
    };

    return {
      ok: true,
      data: reportData,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to compile report: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
