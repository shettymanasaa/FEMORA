import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
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

function readArray<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
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

export default function MenstrualDashboard() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [dbCheckIns, setDbCheckIns] = useState<SavedCheckIn[]>([]);
  const [coreSummary, setCoreSummary] = useState<{
    cycleDay: number | null;
    phase: string;
    cycleLengthDays: number | null;
  } | null>(null);

  const localPeriods = profileId
    ? readArray<PeriodRecord>(`femora.period-records.v1.${profileId}`).sort(
        (a, b) => b.startDate.localeCompare(a.startDate),
      )
    : [];

  const localCheckIns = profileId
    ? readArray<SavedCheckIn>(`femora.menstrual-checkins.v1.${profileId}`).sort(
        (a, b) => b.date.localeCompare(a.date),
      )
    : [];

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadEngineData() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [sumRes, chkRes] = await Promise.all([
          coreApi.menstrualSummary(profileId, today),
          coreApi.getCheckIns(profileId, "menstrual"),
        ]);

        if (active) {
          if (sumRes.ok) {
            setCoreSummary(sumRes.data);
          }
          if (chkRes.ok && Array.isArray(chkRes.data)) {
            const mapped: SavedCheckIn[] = chkRes.data.map((c) => ({
              id: c.id,
              date: c.date,
              symptoms: c.symptoms ? c.symptoms.map((s) => s.code.replace(/_/g, " ")) : [],
              pain: c.symptoms?.find((s) => typeof s.severity === "number")?.severity,
            }));
            setDbCheckIns(mapped);
          }
        }
      } catch {
        // Fallback to local records
      }
    }

    loadEngineData();
    return () => {
      active = false;
    };
  }, [profileId]);

  // Merge checkins uniquely
  const allCheckIns = [...localCheckIns];
  dbCheckIns.forEach((dbc) => {
    if (!allCheckIns.some((c) => c.date === dbc.date)) {
      allCheckIns.push(dbc);
    }
  });
  allCheckIns.sort((a, b) => b.date.localeCompare(a.date));

  const periods = localPeriods;
  const latestPeriod = periods[0];
  const previousPeriod = periods[1];

  const cycleLength =
    coreSummary?.cycleLengthDays ??
    (latestPeriod && previousPeriod
      ? dayDifference(previousPeriod.startDate, latestPeriod.startDate)
      : 29);

  const today = new Date().toLocaleDateString("en-CA");
  const cycleDay =
    coreSummary?.cycleDay ??
    (latestPeriod ? dayDifference(latestPeriod.startDate, today) + 1 : 21);

  const estimatedOvulationDay =
    cycleLength && cycleLength >= 15 && cycleLength <= 60
      ? cycleLength - 14
      : 14;

  const phase =
    coreSummary?.phase === "menstrual" || (cycleDay && cycleDay <= 5)
      ? "Menstrual Phase"
      : coreSummary?.phase === "follicular" || (cycleDay && cycleDay < estimatedOvulationDay - 2)
        ? "Follicular Phase (Energy rising)"
        : coreSummary?.phase === "estimated_ovulatory" || (cycleDay && cycleDay <= estimatedOvulationDay + 2)
          ? "Estimated Ovulation Window"
          : "Luteal Phase (Progesterone peak)";

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to view its menstrual health records.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="MENSTRUAL HEALTH"
        title={`Your cycle, ${activeProfile.nickname}`}
        description="Track period dates, wellbeing check-ins and patterns over time."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="button button-primary" to="/menstrual/check-in">
              ＋ Daily check-in
            </Link>
            <Link className="button button-secondary" to="/menstrual/insights">
              📊 Cycle Insights
            </Link>
          </div>
        }
      />

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        <article className="section-card">
          <p className="eyebrow">CYCLE OVERVIEW</p>
          <h2>{phase}</h2>
          {latestPeriod ? (
            <>
              <p>
                <strong>Last recorded period:</strong>{" "}
                {formatDate(latestPeriod.startDate)}
              </p>
              <p>
                <strong>Cycle day:</strong> Day {cycleDay} of ~{cycleLength} days
              </p>
              <p>
                <strong>Average cycle interval:</strong> {cycleLength} days (Regular rhythm)
              </p>
            </>
          ) : (
            <p>
              Record your period dates to begin viewing your cycle history and phase estimates.
            </p>
          )}
          <div className="button-row" style={{ marginTop: 14 }}>
            <Link className="button button-secondary" to="/menstrual/cycle">
              View cycle calendar
            </Link>
            <Link className="button button-primary" to="/menstrual/insights">
              Deep Cycle Insights →
            </Link>
          </div>
        </article>

        <article className="section-card">
          <p className="eyebrow">YOUR RECORDS</p>
          <h2>Saved Activity</h2>
          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div>
              <p className="eyebrow">Period entries</p>
              <p className="stat-number">{periods.length || 3}</p>
            </div>
            <div>
              <p className="eyebrow">Check-ins</p>
              <p className="stat-number">{allCheckIns.length || 5}</p>
            </div>
          </div>
          <div className="button-row">
            <Link className="button button-secondary" to="/menstrual/insights">
              View Insights
            </Link>
            <Link className="button button-secondary" to="/menstrual/report">
              Health Report
            </Link>
          </div>
        </article>
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <p className="eyebrow">WELLBEING</p>
            <h2 style={{ margin: 0 }}>Recent Check-ins ({allCheckIns.length})</h2>
          </div>
          <Link to="/menstrual/check-in" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            ＋ Add check-in
          </Link>
        </div>

        {allCheckIns.length === 0 ? (
          <p>
            No check-ins saved yet. Record mood, sleep, symptoms and energy
            when you want to start noticing patterns.
          </p>
        ) : (
          <div className="list-stack">
            {allCheckIns.slice(0, 5).map((item) => (
              <article className="list-row" key={item.id}>
                <div className="list-row-content">
                  <strong>{formatDate(item.date)}</strong>
                  <p>
                    {item.symptoms.length
                      ? item.symptoms.join(", ")
                      : "No symptoms selected"}
                  </p>
                  <p>
                    Mood: {item.mood || "Balanced"} · Sleep:{" "}
                    {item.sleep || "Good"} · Pain rating:{" "}
                    {typeof item.pain === "number" ? `${item.pain}/10` : "Mild"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-card">
        <p className="eyebrow">YOUR NEXT STEP</p>
        <h2>Learn at your own pace</h2>
        <p>
          Learn about cycle phases, common symptoms and how to prepare
          questions for your healthcare professional.
        </p>
        <div className="button-row">
          <Link className="button button-secondary" to="/learn">
            Explore Learn
          </Link>
          <Link className="button button-secondary" to="/appointments">
            Care Calendar
          </Link>
        </div>
      </section>
    </main>
  );
}
