import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
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

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function InsightsPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const checkIns = profileId
    ? readArray<SavedCheckIn>(
        `femora.menstrual-checkins.v1.${profileId}`,
      )
    : [];

  const periods = profileId
    ? readArray<PeriodRecord>(
        `femora.period-records.v1.${profileId}`,
      )
    : [];

  const sortedCheckIns = [...checkIns].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  

  const symptomCounts = new Map<string, number>();

  checkIns.forEach((entry) => {
    entry.symptoms.forEach((symptom) => {
      symptomCounts.set(
        symptom,
        (symptomCounts.get(symptom) ?? 0) + 1,
      );
    });
  });

  const commonSymptoms = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const painEntries = checkIns.filter(
    (entry) => typeof entry.pain === "number",
  );

  const averagePain = painEntries.length
    ? (
        painEntries.reduce((total, entry) => total + (entry.pain ?? 0), 0) /
        painEntries.length
      ).toFixed(1)
    : null;

  const sleepCounts = new Map<string, number>();
  checkIns.forEach((entry) => {
    if (entry.sleep) {
      sleepCounts.set(
        entry.sleep,
        (sleepCounts.get(entry.sleep) ?? 0) + 1,
      );
    }
  });

  const moodCounts = new Map<string, number>();
  checkIns.forEach((entry) => {
    if (entry.mood) {
      moodCounts.set(
        entry.mood,
        (moodCounts.get(entry.mood) ?? 0) + 1,
      );
    }
  });

  const topSleep = [...sleepCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  const topMood = [...moodCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to view its insights.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="YOUR PERSONAL RECORDS"
        title="Your insights"
        description="A summary of the menstrual health information you have chosen to save."
        action={
          <Link className="button button-primary" to="/menstrual/check-in">
            Add check-in
          </Link>
        }
      />

      {checkIns.length === 0 && periods.length === 0 ? (
        <section className="section-card">
          <h2>Your insights will grow with your records</h2>
          <p>
            Save a period date or wellbeing check-in to start seeing
            summaries here. There are no sample results in this view.
          </p>
          <div className="button-row">
            <Link className="button button-primary" to="/menstrual/cycle">
              Record period dates
            </Link>
            <Link className="button button-secondary" to="/menstrual/check-in">
              Record wellbeing
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-3" style={{ marginBottom: 20 }}>
            <article className="section-card">
              <p className="eyebrow">CHECK-INS</p>
              <p className="stat-number">{checkIns.length}</p>
              <p>Saved wellbeing entries</p>
            </article>

            <article className="section-card">
              <p className="eyebrow">PERIOD HISTORY</p>
              <p className="stat-number">{periods.length}</p>
              <p>Saved period start dates</p>
            </article>

            <article className="section-card">
              <p className="eyebrow">RECORDED PAIN</p>
              <p className="stat-number">
                {averagePain === null ? "—" : `${averagePain}/10`}
              </p>
              <p>
                {averagePain === null
                  ? "No pain ratings saved"
                  : "Average of entries with a pain rating"}
              </p>
            </article>
          </section>

          <section className="grid grid-2" style={{ marginBottom: 20 }}>
            <article className="section-card">
              <h2>Symptoms you have logged</h2>
              {commonSymptoms.length === 0 ? (
                <p>No symptoms have been selected in your check-ins.</p>
              ) : (
                <div className="list-stack">
                  {commonSymptoms.map(([symptom, count]) => (
                    <div className="list-row" key={symptom}>
                      <span>{symptom}</span>
                      <strong>
                        {count} {count === 1 ? "entry" : "entries"}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="section-card">
              <h2>Mood and sleep entries</h2>
              <p>
                <strong>Most frequently recorded sleep rating:</strong>{" "}
                {topSleep
                  ? `${topSleep[0]} (${topSleep[1]} ${topSleep[1] === 1 ? "entry" : "entries"})`
                  : "No sleep ratings saved"}
              </p>
              <p>
                <strong>Most frequently recorded mood:</strong>{" "}
                {topMood
                  ? `${topMood[0]} (${topMood[1]} ${topMood[1] === 1 ? "entry" : "entries"})`
                  : "No mood entries saved"}
              </p>
              <p className="field-help">
                These are counts of saved entries, not evidence that a
                symptom or mood is caused by a particular cycle phase.
              </p>
            </article>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Recent check-ins</h2>
            {sortedCheckIns.length === 0 ? (
              <p>You have not saved any check-ins yet.</p>
            ) : (
              <div className="list-stack">
                {sortedCheckIns.slice(0, 10).map((entry) => (
                  <article className="list-row" key={entry.id}>
                    <div className="list-row-content">
                      <strong>{formatDate(entry.date)}</strong>
                      <p>
                        Symptoms:{" "}
                        {entry.symptoms.length
                          ? entry.symptoms.join(", ")
                          : "None selected"}
                      </p>
                      <p>
                        Mood: {entry.mood || "Not recorded"} · Sleep:{" "}
                        {entry.sleep || "Not recorded"} · Energy:{" "}
                        {entry.energy || "Not recorded"}
                      </p>
                      {entry.notes && <p>Notes: {entry.notes}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="section-card">
        <h2>Next steps</h2>
        <div className="button-row">
          <Link className="button button-secondary" to="/menstrual/cycle">
            Review cycle dates
          </Link>
          <Link className="button button-secondary" to="/menstrual/report">
            Review health report
          </Link>
          <Link className="button button-secondary" to="/learn">
            Explore Learn
          </Link>
        </div>
      </section>

      <p className="field-help" style={{ marginTop: 16 }}>
        These summaries describe only the records saved in this browser.
        They are not clinically validated findings or a medical diagnosis.
      </p>
    </main>
  );
}
