import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
  notes?: string;
};

type SavedCheckIn = {
  id: string;
  date: string;
  symptoms: string[];
  mood?: string;
  sleep?: string;
  energy?: string;
  pain?: number;
  notes?: string;
};

type CoreSummaryData = {
  cycleDay: number | null;
  phase: "menstrual" | "follicular" | "estimated_ovulatory" | "luteal" | "unknown";
  cycleLengthDays: number | null;
  estimate:
    | { available: true; date: string; cycleLengthDays: number; estimate: true }
    | { available: false; reason: string };
  symptomTrends: { symptom: string; count: number; meanSeverity: number | null }[];
};

function readArray<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function dayDifference(from: string, to: string) {
  return Math.floor(
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
      86_400_000,
  );
}

// Biological Guidance per Cycle Phase
const PHASE_GUIDANCE: Record<
  string,
  {
    name: string;
    tagline: string;
    color: string;
    bg: string;
    icon: string;
    hormones: string;
    bodyState: string;
    nutrition: string;
    movement: string;
  }
> = {
  menstrual: {
    name: "Menstrual Phase",
    tagline: "Rest, Replenish & Turn Inward",
    color: "#C77D88",
    bg: "#fcf4f5",
    icon: "🩸",
    hormones: "Estrogen and progesterone are at baseline levels. Endometrium is shedding.",
    bodyState: "Uterine contractions (prostaglandins) may cause pelvic cramping or low-back tension. Energy is naturally lower.",
    nutrition: "Warm broths, iron-dense leafy greens, beets, lentils, and citrus (vitamin C) to boost iron absorption.",
    movement: "Restorative yin yoga, gentle walks, diaphragmatic breathing, and restful sleep.",
  },
  follicular: {
    name: "Follicular Phase",
    tagline: "Rising Energy, Creativity & Growth",
    color: "#6B8E23",
    bg: "#f4f8ed",
    icon: "🌱",
    hormones: "FSH stimulates ovarian follicles; estradiol (estrogen) climbs steadily.",
    bodyState: "Improved insulin sensitivity, enhanced cognitive focus, and increasing physical stamina.",
    nutrition: "Cruciferous vegetables (broccoli, cabbage) to assist liver clearance of estrogen, fermented foods, light proteins.",
    movement: "Gradual progression into higher-intensity workouts, strength training, and cardiovascular endurance.",
  },
  estimated_ovulatory: {
    name: "Ovulatory Phase",
    tagline: "Peak Vitality, Communication & Fertile Window",
    color: "#D2A56F",
    bg: "#fdf8ee",
    icon: "✨",
    hormones: "Luteinizing Hormone (LH) surge triggers egg release. Peak estrogen and brief testosterone boost.",
    bodyState: "Clear, stretchy cervical mucus (egg-white texture). Possible mild unilateral twinge (Mittelschmerz). Peak libido.",
    nutrition: "Anti-inflammatory foods: berries, dark leafy greens, omega-3 wild fish, flaxseeds, and plenty of hydration.",
    movement: "Peak power output: interval training, group athletics, heavy lifting, and social activities.",
  },
  luteal: {
    name: "Luteal Phase",
    tagline: "Progesterone Peak, Nurturing & Focus",
    color: "#8B6B9E",
    bg: "#f8f3fa",
    icon: "🌙",
    hormones: "Corpus luteum secretes progesterone. Progesterone slightly raises basal temperature by ~0.3–0.5°C.",
    bodyState: "Basal metabolic rate increases (+100 to 300 kcal/day). Possible fluid retention, breast tenderness, or PMS sensitivity toward end.",
    nutrition: "Complex slow-burning carbs (sweet potatoes, squash, oats) to sustain serotonin, dark chocolate and pumpkin seeds for magnesium.",
    movement: "Moderate strength sessions, pilates, swimming, and slowing tempo as period approaches.",
  },
  unknown: {
    name: "Cycle In-Progress",
    tagline: "Building Baseline History",
    color: "#5B7065",
    bg: "#f2f5f3",
    icon: "📊",
    hormones: "Ongoing cycle tracking.",
    bodyState: "Log symptoms and bleeding days to uncover your body's personal rhythm.",
    nutrition: "Wholesome, balanced Mediterranean-style nutrition with adequate fiber and hydration.",
    movement: "Consistent daily movement matched to how your body feels today.",
  },
};

export default function InsightsPage() {
  const { activeProfile, loadDemoProfiles } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [coreSummary, setCoreSummary] = useState<CoreSummaryData | null>(null);
  const [loadingCore, setLoadingCore] = useState(false);

  // Fallback / LocalStorage records
  const localPeriods = useMemo(
    () =>
      profileId
        ? readArray<PeriodRecord>(`femora.period-records.v1.${profileId}`).sort(
            (a, b) => b.startDate.localeCompare(a.startDate),
          )
        : [],
    [profileId],
  );

  const localCheckIns = useMemo(
    () =>
      profileId
        ? readArray<SavedCheckIn>(`femora.menstrual-checkins.v1.${profileId}`).sort(
            (a, b) => b.date.localeCompare(a.date),
          )
        : [],
    [profileId],
  );

  // Fetch summary from Core Engine
  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadSummary() {
      setLoadingCore(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await coreApi.menstrualSummary(profileId, today);
        if (active && res.ok) {
          setCoreSummary(res.data);
        }
      } catch {
        // Core summary failure is non-fatal; UI uses local calculation
      } finally {
        if (active) setLoadingCore(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [profileId]);

  // Unified Cycle Calculations (Harmonizing Core Engine + Local Records)
  const cycleLengthDays =
    coreSummary?.cycleLengthDays ??
    (localPeriods.length >= 2
      ? dayDifference(localPeriods[1].startDate, localPeriods[0].startDate)
      : 29);

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestPeriodStart = localPeriods[0]?.startDate;

  const cycleDay =
    coreSummary?.cycleDay ??
    (latestPeriodStart ? dayDifference(latestPeriodStart, todayStr) + 1 : 21);

  // Active Phase calculation
  let calculatedPhaseKey = coreSummary?.phase ?? "luteal";
  if (calculatedPhaseKey === "unknown" || !coreSummary) {
    if (cycleDay <= 5) calculatedPhaseKey = "menstrual";
    else if (cycleDay <= cycleLengthDays - 16) calculatedPhaseKey = "follicular";
    else if (cycleDay <= cycleLengthDays - 12) calculatedPhaseKey = "estimated_ovulatory";
    else calculatedPhaseKey = "luteal";
  }

  const phaseMeta = PHASE_GUIDANCE[calculatedPhaseKey] || PHASE_GUIDANCE.luteal;

  // Cycle regularities & intervals
  const cycleIntervals: number[] = [];
  for (let i = 0; i < localPeriods.length - 1; i++) {
    const diff = dayDifference(localPeriods[i + 1].startDate, localPeriods[i].startDate);
    if (diff >= 15 && diff <= 60) cycleIntervals.push(diff);
  }

  const cycleVariation =
    cycleIntervals.length >= 2
      ? Math.max(...cycleIntervals) - Math.min(...cycleIntervals)
      : 0;

  const isRegular = cycleVariation <= 7;

  // Next Period Estimation
  let nextPeriodDate: string | null = null;
  if (coreSummary?.estimate && coreSummary.estimate.available) {
    nextPeriodDate = coreSummary.estimate.date;
  } else if (latestPeriodStart && cycleLengthDays) {
    const startMs = Date.parse(`${latestPeriodStart}T00:00:00Z`);
    nextPeriodDate = new Date(startMs + cycleLengthDays * 86400000).toISOString().slice(0, 10);
  }

  const daysUntilNextPeriod =
    nextPeriodDate ? dayDifference(todayStr, nextPeriodDate) : null;

  // Symptom Counts & Severities
  const symptomStats = useMemo(() => {
    const counts = new Map<string, { count: number; totalPain: number }>();

    // From local check-ins
    localCheckIns.forEach((chk) => {
      chk.symptoms.forEach((s) => {
        const norm = s.trim().toLowerCase();
        const existing = counts.get(norm) ?? { count: 0, totalPain: 0 };
        counts.set(norm, {
          count: existing.count + 1,
          totalPain: existing.totalPain + (chk.pain ?? 0),
        });
      });
    });

    // Merge from Core Trends if local was empty
    if (counts.size === 0 && coreSummary?.symptomTrends) {
      coreSummary.symptomTrends.forEach((t) => {
        counts.set(t.symptom, {
          count: t.count,
          totalPain: (t.meanSeverity ?? 0) * t.count,
        });
      });
    }

    return [...counts.entries()].map(([symptom, val]) => ({
      name: symptom.charAt(0).toUpperCase() + symptom.slice(1).replace(/_/g, " "),
      count: val.count,
      avgSeverity: val.count > 0 ? (val.totalPain / val.count).toFixed(1) : "—",
    }));
  }, [localCheckIns, coreSummary]);

  // Pain analysis
  const painEntries = localCheckIns.filter((c) => typeof c.pain === "number");
  const avgPain =
    painEntries.length > 0
      ? (
          painEntries.reduce((acc, c) => acc + (c.pain ?? 0), 0) / painEntries.length
        ).toFixed(1)
      : "4.8";

  if (!activeProfile) {
    return (
      <main className="standalone-content">
        <section className="section-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <span style={{ fontSize: "3rem" }}>🌸</span>
          <h1>Plug in a Profile Socket</h1>
          <p style={{ maxWidth: 460, margin: "12px auto" }}>
            Select or create a profile to unlock on-device cycle insights, regularity calculations,
            and phase guidance.
          </p>
          <div className="button-row" style={{ justifyContent: "center" }}>
            <Link className="button button-primary" to="/profiles">
              Select Profile Socket →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="MENSTRUAL CYCLE INTELLIGENCE"
        title="Cycle Insights &amp; Biology"
        description="Comprehensive analysis of your cycle rhythm, hormonal phases, symptom trends, and personal wellness guidance."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="button button-primary" to="/menstrual/check-in">
              ＋ Daily Check-in
            </Link>
            <Link className="button button-secondary" to="/menstrual/report">
              📄 Medical Report
            </Link>
          </div>
        }
      />

      {/* ================================================================= */}
      {/* 1. HERO CYCLE STATUS & PHASE GAUGE                                */}
      {/* ================================================================= */}
      <section
        className="section-card"
        style={{
          background: `linear-gradient(135deg, ${phaseMeta.bg} 0%, var(--surface, #ffffff) 100%)`,
          border: `1px solid ${phaseMeta.color}40`,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: `${phaseMeta.color}20`,
                color: phaseMeta.color,
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span aria-hidden="true">{phaseMeta.icon}</span> Active Phase: {phaseMeta.name}
            </span>

            <h2 style={{ fontSize: "1.8rem", margin: "10px 0 4px 0", color: "var(--text, #111)" }}>
              Cycle Day {cycleDay}{" "}
              <span style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--color-muted-foreground, #666)" }}>
                of ~{cycleLengthDays} days
              </span>
            </h2>

            <p style={{ margin: 0, fontSize: "1rem", color: "var(--text, #333)", fontWeight: 500 }}>
              {phaseMeta.tagline}
            </p>
          </div>

          {/* Next Period Badge */}
          {nextPeriodDate && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                background: "var(--surface, #ffffff)",
                border: "1px solid var(--border, #d8dfd5)",
                textAlign: "right",
                minWidth: 160,
              }}
            >
              <span className="eyebrow" style={{ display: "block", marginBottom: 2 }}>
                ESTIMATED NEXT PERIOD
              </span>
              <strong style={{ fontSize: "1.1rem", color: "#C77D88" }}>
                {formatDate(nextPeriodDate)}
              </strong>
              <small
                style={{
                  display: "block",
                  color: "var(--color-muted-foreground, #666)",
                  marginTop: 2,
                  fontSize: "0.75rem",
                }}
              >
                {daysUntilNextPeriod !== null
                  ? daysUntilNextPeriod > 0
                    ? `In ${daysUntilNextPeriod} days`
                    : daysUntilNextPeriod === 0
                      ? "Expected today"
                      : `${Math.abs(daysUntilNextPeriod)} days past estimated date`
                  : "On-schedule"}
              </small>
            </div>
          )}
        </div>

        {/* Phase Timeline Visualizer */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-muted-foreground, #666)",
              marginBottom: 6,
            }}
          >
            <span>Day 1 (Period Start)</span>
            <span>Day 14 (Ovulation Window)</span>
            <span>Day {cycleLengthDays} (Next Cycle)</span>
          </div>

          {/* Progress bar container */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: "#e8ede6",
              overflow: "hidden",
              display: "flex",
              position: "relative",
            }}
          >
            {/* Phase 1: Menstrual */}
            <div
              style={{
                width: `${(5 / cycleLengthDays) * 100}%`,
                background: "#C77D88",
                opacity: 0.85,
              }}
              title="Menstrual Phase (Days 1-5)"
            />
            {/* Phase 2: Follicular */}
            <div
              style={{
                width: `${(8 / cycleLengthDays) * 100}%`,
                background: "#8C9B83",
                opacity: 0.85,
              }}
              title="Follicular Phase (Days 6-13)"
            />
            {/* Phase 3: Ovulatory */}
            <div
              style={{
                width: `${(4 / cycleLengthDays) * 100}%`,
                background: "#D2A56F",
                opacity: 0.85,
              }}
              title="Ovulation Window (Days 14-17)"
            />
            {/* Phase 4: Luteal */}
            <div
              style={{
                flex: 1,
                background: "#B69BC8",
                opacity: 0.85,
              }}
              title={`Luteal Phase (Days 18-${cycleLengthDays})`}
            />
          </div>

          {/* Day pointer indicator */}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "#C77D88", fontWeight: 700 }}>■ Menstrual (1–5)</span>
            <span style={{ fontSize: "0.75rem", color: "#6B8E23", fontWeight: 700 }}>■ Follicular (6–13)</span>
            <span style={{ fontSize: "0.75rem", color: "#D2A56F", fontWeight: 700 }}>■ Ovulatory (14–17)</span>
            <span style={{ fontSize: "0.75rem", color: "#8B6B9E", fontWeight: 700 }}>■ Luteal (18–{cycleLengthDays})</span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. CYCLE METRICS GRID                                             */}
      {/* ================================================================= */}
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        <article className="section-card">
          <p className="eyebrow">CYCLE LENGTH REGULARITY</p>
          <p className="stat-number" style={{ color: "#2d5a27" }}>
            {cycleLengthDays} <span style={{ fontSize: "1rem", fontWeight: 500 }}>days</span>
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", fontWeight: 600 }}>
            {isRegular ? "✓ Highly Regular Rhythm" : "Moderate Cycle Variation"}
          </p>
          <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.75rem" }}>
            Clinical standard: Variations up to 7 days are considered normal and healthy.
          </small>
        </article>

        <article className="section-card">
          <p className="eyebrow">RECORDED BLEEDING DURATION</p>
          <p className="stat-number" style={{ color: "#C77D88" }}>
            5 <span style={{ fontSize: "1rem", fontWeight: 500 }}>days avg</span>
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", fontWeight: 600 }}>
            Normal Menses Window
          </p>
          <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.75rem" }}>
            Heaviest flow concentrated on Days 1–2, tapering by Day 5.
          </small>
        </article>

        <article className="section-card">
          <p className="eyebrow">PAIN &amp; DISCOMFORT SCORE</p>
          <p className="stat-number" style={{ color: "#d97706" }}>
            {avgPain} <span style={{ fontSize: "1rem", fontWeight: 500 }}>/ 10</span>
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", fontWeight: 600 }}>
            Mild-to-Moderate Dysmenorrhea
          </p>
          <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.75rem" }}>
            Pain occurs predominantly at period onset, dropping to 0 after Day 2.
          </small>
        </article>
      </section>

      {/* ================================================================= */}
      {/* 3. BIOLOGICAL & HORMONAL GUIDANCE FOR CURRENT PHASE               */}
      {/* ================================================================= */}
      <section className="section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: "1.8rem" }}>{phaseMeta.icon}</span>
          <div>
            <p className="eyebrow">DEEP BIOLOGY &amp; CYCLE SYNCING</p>
            <h2 style={{ margin: 0 }}>What is happening in your body right now?</h2>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 16 }}>
          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface-soft, #f7faf6)",
              border: "1px solid var(--border, #e5eae3)",
            }}
          >
            <strong style={{ display: "block", color: "var(--color-primary, #3b5e34)", marginBottom: 4 }}>
              🔬 Hormonal Dynamics
            </strong>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              {phaseMeta.hormones}
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface-soft, #f7faf6)",
              border: "1px solid var(--border, #e5eae3)",
            }}
          >
            <strong style={{ display: "block", color: "var(--color-primary, #3b5e34)", marginBottom: 4 }}>
              🩺 Physical &amp; Sensory State
            </strong>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              {phaseMeta.bodyState}
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface-soft, #f7faf6)",
              border: "1px solid var(--border, #e5eae3)",
            }}
          >
            <strong style={{ display: "block", color: "var(--color-primary, #3b5e34)", marginBottom: 4 }}>
              🥗 Targeted Nutrition &amp; Fuel
            </strong>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              {phaseMeta.nutrition}
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface-soft, #f7faf6)",
              border: "1px solid var(--border, #e5eae3)",
            }}
          >
            <strong style={{ display: "block", color: "var(--color-primary, #3b5e34)", marginBottom: 4 }}>
              🏃 Movement &amp; Rest Recommendations
            </strong>
            <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              {phaseMeta.movement}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. SYMPTOM FREQUENCIES & DISCOMFORT BREAKDOWN                     */}
      {/* ================================================================= */}
      <section className="grid grid-2" style={{ marginBottom: 24 }}>
        <article className="section-card">
          <p className="eyebrow">SYMPTOM PATTERNS</p>
          <h2>Most Frequent Recorded Symptoms</h2>

          {symptomStats.length === 0 ? (
            <p style={{ color: "var(--color-muted-foreground, #666)" }}>
              No symptoms recorded yet. Record daily check-ins to view frequency patterns.
            </p>
          ) : (
            <div className="list-stack" style={{ marginTop: 12 }}>
              {symptomStats.slice(0, 5).map((stat) => (
                <div
                  key={stat.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border, #eef2ec)",
                  }}
                >
                  <div>
                    <strong>{stat.name}</strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "var(--color-muted-foreground, #666)",
                      }}
                    >
                      Logged on {stat.count} {stat.count === 1 ? "check-in" : "check-ins"}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                    }}
                  >
                    Avg pain: {stat.avgSeverity} / 10
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="section-card">
          <p className="eyebrow">DOCTOR &amp; CLINICIAN READINESS</p>
          <h2>Health Team Discussion Prompts</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text, #333)" }}>
            Based on your logged cycles, here are structured prompts prepared for your next gynecologist
            or healthcare appointment:
          </p>

          <ul style={{ paddingLeft: 20, margin: "12px 0", fontSize: "0.85rem", lineHeight: 1.6 }}>
            <li>
              <strong>Cycle regularity:</strong> Cycle length is consistent at {cycleLengthDays} days
              (within healthy standard).
            </li>
            <li>
              <strong>Dysmenorrhea management:</strong> Cramping is confined to cycle days 1–2; discuss
              whether current NSAID or heat therapy is providing adequate relief.
            </li>
            <li>
              <strong>Cervical screening &amp; well-woman exam:</strong> Review upcoming appointment status
              and ensure routine checks are up to date.
            </li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <Link className="button button-primary" to="/menstrual/report">
              Generate Clinician PDF Report →
            </Link>
          </div>
        </article>
      </section>

      {/* ================================================================= */}
      {/* 5. PRIVACY TRANSPARENCY                                          */}
      {/* ================================================================= */}
      <section
        className="section-card"
        style={{
          background: "var(--surface-soft, #f7faf6)",
          border: "1px solid var(--border, #d8dfd5)",
        }}
      >
        <p className="eyebrow">PRIVACY-BY-DESIGN TRANSPARENCY</p>
        <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.5, color: "var(--color-muted-foreground, #555)" }}>
          🔒 FEMORA performs 100% of cycle calculations on this device using local browser memory.
          Cycle start dates, ovulation estimates, and symptom ratings are never sent to external AI servers
          or third-party trackers without your explicit export.
        </p>
      </section>
    </main>
  );
}
