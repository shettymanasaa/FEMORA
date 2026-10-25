import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";

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

  const periods = profileId
    ? readArray<PeriodRecord>(`femora.period-records.v1.${profileId}`).sort(
        (a, b) => b.startDate.localeCompare(a.startDate),
      )
    : [];

  const checkIns = profileId
    ? readArray<SavedCheckIn>(`femora.menstrual-checkins.v1.${profileId}`).sort(
        (a, b) => b.date.localeCompare(a.date),
      )
    : [];

  const latestPeriod = periods[0];
  const previousPeriod = periods[1];

  const cycleLength =
    latestPeriod && previousPeriod
      ? dayDifference(previousPeriod.startDate, latestPeriod.startDate)
      : null;

  const today = new Date().toLocaleDateString("en-CA");
  const cycleDay = latestPeriod
    ? dayDifference(latestPeriod.startDate, today) + 1
    : null;

  const estimatedOvulationDay =
    cycleLength && cycleLength >= 15 && cycleLength <= 60
      ? cycleLength - 14
      : 14;

  const phase =
    cycleDay === null
      ? "Not available yet"
      : cycleDay <=
          Math.max(
            1,
            latestPeriod?.endDate && latestPeriod.startDate
              ? dayDifference(latestPeriod.startDate, latestPeriod.endDate) + 1
              : 5,
          )
        ? "Menstruation (based on recorded dates)"
        : cycleDay >= estimatedOvulationDay - 2 &&
            cycleDay <= estimatedOvulationDay + 2
          ? "Estimated ovulation window"
          : cycleDay < estimatedOvulationDay - 2
            ? "Estimated follicular phase"
            : "Estimated luteal phase";

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
          <Link className="button button-primary" to="/menstrual/check-in">
            Daily check-in
          </Link>
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
                <strong>Estimated cycle day:</strong>{" "}
                {cycleDay && cycleDay > 0 ? cycleDay : "Not available"}
              </p>
              <p>
                <strong>Recorded cycle interval:</strong>{" "}
                {cycleLength ? `${cycleLength} days` : "Need another period start date"}
              </p>
            </>
          ) : (
            <p>
              Record your first period date to begin viewing your cycle
              history and calendar-based phase estimates.
            </p>
          )}
          <p className="field-help">
            Cycle and ovulation dates are estimates, not confirmation of
            ovulation, fertility or contraception safety.
          </p>
          <Link className="button button-secondary" to="/menstrual/cycle">
            View cycle calendar
          </Link>
        </article>

        <article className="section-card">
          <p className="eyebrow">YOUR RECORDS</p>
          <h2>Saved activity</h2>
          <div className="grid grid-2">
            <div>
              <p className="eyebrow">Period entries</p>
              <p className="stat-number">{periods.length}</p>
            </div>
            <div>
              <p className="eyebrow">Check-ins</p>
              <p className="stat-number">{checkIns.length}</p>
            </div>
          </div>
          <div className="button-row">
            <Link className="button button-secondary" to="/menstrual/insights">
              View insights
            </Link>
            <Link className="button button-secondary" to="/menstrual/report">
              Health report
            </Link>
          </div>
        </article>
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">WELLBEING</p>
            <h2>Recent check-ins</h2>
          </div>
          <Link to="/menstrual/check-in">Add check-in →</Link>
        </div>

        {checkIns.length === 0 ? (
          <p>
            No check-ins saved yet. Record mood, sleep, symptoms and energy
            when you want to start noticing patterns.
          </p>
        ) : (
          <div className="list-stack">
            {checkIns.slice(0, 5).map((item) => (
              <article className="list-row" key={item.id}>
                <div className="list-row-content">
                  <strong>{formatDate(item.date)}</strong>
                  <p>
                    {item.symptoms.length
                      ? item.symptoms.join(", ")
                      : "No symptoms selected"}
                  </p>
                  <p>
                    Mood: {item.mood || "Not recorded"} · Sleep:{" "}
                    {item.sleep || "Not recorded"} · Energy:{" "}
                    {item.energy || "Not recorded"}
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
            Open care calendar
          </Link>
        </div>
      </section>
    </main>
  );
}