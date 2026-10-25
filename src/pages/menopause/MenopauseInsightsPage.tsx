
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { readLocalJson } from "../../lib/utils";

type MenopauseCheckIn = {
  id: string;
  date: string;
  stage: string;
  symptoms: string[];
  severity: string;
  mood?: string;
  sleep?: string;
  energy?: string;
  notes?: string;
  createdAt: string;
};

function formatDate(date: string) {
  if (!date) return "Date not recorded";

  const parsed = new Date(`${date}T12:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function MenopauseInsightsPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.menopause-checkins.v1.${profileId}`;

  const records = profileId
    ? readLocalJson<MenopauseCheckIn[]>(storageKey, [])
    : [];

  const sortedRecords = [...records].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const symptomCounts = sortedRecords.reduce<Record<string, number>>(
    (counts, record) => {
      (record.symptoms ?? []).forEach((symptom) => {
        counts[symptom] = (counts[symptom] ?? 0) + 1;
      });
      return counts;
    },
    {},
  );

  const symptoms = Object.entries(symptomCounts).sort(
    (a, b) => b[1] - a[1],
  );

  const severityCounts = sortedRecords.reduce<Record<string, number>>(
    (counts, record) => {
      const severity = record.severity?.trim();
      if (severity) {
        counts[severity] = (counts[severity] ?? 0) + 1;
      }
      return counts;
    },
    {},
  );

  function countField(field: "mood" | "sleep" | "energy") {
    const counts: Record<string, number> = {};

    sortedRecords.forEach((record) => {
      const value = record[field]?.trim();
      if (value) counts[value] = (counts[value] ?? 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  const moods = countField("mood");
  const sleepValues = countField("sleep");
  const energyValues = countField("energy");

  const latestDate = sortedRecords[0]?.date;
  const oldestDate = sortedRecords[sortedRecords.length - 1]?.date;

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to view your wellbeing insights.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="YOUR WELLBEING"
        title="Your wellbeing insights"
        description="Explore summaries of the symptoms and wellbeing details you have recorded. These patterns are for reflection and are not a diagnosis."
        action={
          <Link className="button button-primary" to="/menopause/check-in">
            + New check-in
          </Link>
        }
      />

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        <article className="section-card">
          <p className="eyebrow">RECORDS ANALYSED</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {sortedRecords.length}
          </h2>
          <p>Saved check-ins included in these summaries.</p>
        </article>

        <article className="section-card">
          <p className="eyebrow">SYMPTOMS TRACKED</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {symptoms.length}
          </h2>
          <p>Different symptoms recorded at least once.</p>
        </article>
      </section>

      {sortedRecords.length > 0 && (
        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Records covered</h2>
          <p>
            From <strong>{formatDate(oldestDate ?? "")}</strong> to{" "}
            <strong>{formatDate(latestDate ?? "")}</strong>
          </p>
        </section>
      )}

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>Symptom patterns</h2>
        <p>
          Frequency means how many saved check-ins included each symptom. It
          does not measure medical severity.
        </p>

        {symptoms.length === 0 ? (
          <p>
            No symptoms recorded yet. Add symptoms during a check-in to see
            your personal summaries here.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {symptoms.map(([symptom, count]) => {
              const percentage = Math.round(
                (count / sortedRecords.length) * 100,
              );

              return (
                <div key={symptom}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <strong>{symptom}</strong>
                    <span>
                      {count} {count === 1 ? "check-in" : "check-ins"}
                    </span>
                  </div>

                  <div
                    role="img"
                    aria-label={`${symptom}: present in ${percentage}% of saved check-ins`}
                    style={{
                      height: 10,
                      background: "var(--border, #e5e7eb)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentage}%`,
                        background: "var(--primary, #64748b)",
                        borderRadius: 99,
                      }}
                    />
                  </div>

                  <small>{percentage}% of saved check-ins</small>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>Recorded symptom severity</h2>
        <p>Based only on the severity values you selected in your check-ins.</p>

        {Object.keys(severityCounts).length === 0 ? (
          <p>No severity values have been recorded yet.</p>
        ) : (
          <ul>
            {Object.entries(severityCounts).map(([severity, count]) => (
              <li key={severity}>
                <strong>{severity}:</strong> {count}{" "}
                {count === 1 ? "check-in" : "check-ins"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        {[
          { title: "Mood", values: moods },
          { title: "Sleep", values: sleepValues },
          { title: "Energy", values: energyValues },
        ].map((section) => (
          <article className="section-card" key={section.title}>
            <h2>{section.title} summary</h2>

            {section.values.length === 0 ? (
              <p>No {section.title.toLowerCase()} details recorded yet.</p>
            ) : (
              <ul>
                {section.values.map(([value, count]) => (
                  <li key={value}>
                    {value}: {count}{" "}
                    {count === 1 ? "entry" : "entries"}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section className="section-card">
        <h2>Prepare for your next care conversation</h2>
        <p>
          Use your records to discuss changes, concerns and questions with a
          qualified healthcare professional. These summaries cannot determine
          the cause of symptoms.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button button-primary" to="/menopause/care">
            Manage care notes
          </Link>
          <Link className="button" to="/menopause/report">
            Open health report
          </Link>
          <Link className="button" to="/menopause">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
