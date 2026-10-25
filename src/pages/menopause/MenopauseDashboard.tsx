
import { useState } from "react";
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

export default function MenopauseDashboard() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.menopause-checkins.v1.${profileId}`;

  const [refresh, setRefresh] = useState(0);

  const records = profileId
    ? readLocalJson<MenopauseCheckIn[]>(storageKey, [])
    : [];

  const sortedRecords = [...records].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const latestRecords = sortedRecords.slice(0, 3);

  const symptomCounts = sortedRecords.reduce<Record<string, number>>(
    (counts, record) => {
      (record.symptoms ?? []).forEach((symptom) => {
        counts[symptom] = (counts[symptom] ?? 0) + 1;
      });
      return counts;
    },
    {},
  );

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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

  function deleteCheckIn(id: string) {
    if (!profileId) return;

    const confirmed = window.confirm(
      "Delete this check-in? This cannot be undone.",
    );

    if (!confirmed) return;

    const updated = records.filter((record) => record.id !== id);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setRefresh((value) => value + 1);
    } catch {
      window.alert("Unable to delete this check-in. Please try again.");
    }
  }

  const displayedRecords = refresh >= 0 ? latestRecords : [];

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to view your menopause wellbeing records.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="PERIMENOPAUSE & MENOPAUSE"
        title="Your wellbeing, through change."
        description="Track how you feel, reflect on symptom patterns and prepare questions for your healthcare professional."
        action={
          <Link className="button button-primary" to="/menopause/check-in">
            + New check-in
          </Link>
        }
      />

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        <article className="section-card">
          <p className="eyebrow">TOTAL CHECK-INS</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {records.length}
          </h2>
          <p>
            {records.length === 1
              ? "Check-in saved for this profile."
              : "Saved check-ins for this profile."}
          </p>
        </article>

        <article className="section-card">
          <p className="eyebrow">SYMPTOMS RECORDED</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {Object.keys(symptomCounts).length}
          </h2>
          <p>Different symptoms recorded across your check-ins.</p>
        </article>
      </section>

      {/* QUICK ACCESS */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Quick access</h2>

        <div className="grid grid-2">
          <Link
            to="/menopause/check-in"
            className="section-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <span aria-hidden="true">＋</span>
            <h3>Daily check-in</h3>
            <p>Record how you feel and track your symptoms.</p>
            <strong>Open check-in →</strong>
          </Link>

          <Link
            to="/menopause/insights"
            className="section-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <span aria-hidden="true">↗</span>
            <h3>Wellbeing insights</h3>
            <p>
              Explore symptom patterns, severity and changes across your
              saved check-ins.
            </p>
            <strong>View insights →</strong>
          </Link>

          <Link
            to="/menopause/report"
            className="section-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <span aria-hidden="true">▤</span>
            <h3>Health report</h3>
            <p>Review your records and prepare for healthcare discussions.</p>
            <strong>Open report →</strong>
          </Link>

          <Link
            to="/menopause/learn"
            className="section-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <span aria-hidden="true">i</span>
            <h3>Learn</h3>
            <p>Explore educational information about menopause and wellbeing.</p>
            <strong>Explore learning →</strong>
          </Link>

          <Link
            to="/menopause/care"
            className="section-card"
            style={{ textDecoration: "none", display: "block" }}
          >
            <span aria-hidden="true">＋</span>
            <h3>Ongoing care</h3>
            <p>Keep questions and follow-up topics ready for appointments.</p>
            <strong>Manage care notes →</strong>
          </Link>
        </div>
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2>Recent check-ins</h2>
            <p>Your latest saved wellbeing records.</p>
          </div>

          <Link className="button" to="/menopause/check-in">
            Record how you feel
          </Link>
        </div>

        {displayedRecords.length === 0 ? (
          <div style={{ padding: "20px 0" }}>
            <p>No check-ins yet. Your saved entries will appear here.</p>
            <Link className="button button-primary" to="/menopause/check-in">
              Create your first check-in
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {displayedRecords.map((record) => (
              <article
                key={record.id}
                style={{
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{formatDate(record.date)}</strong>
                    <p style={{ margin: "6px 0" }}>
                      {record.stage || "Menopause journey"}
                      {record.severity
                        ? ` · ${record.severity} symptom severity`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button"
                    onClick={() => deleteCheckIn(record.id)}
                  >
                    Delete
                  </button>
                </div>

                {record.symptoms?.length > 0 && (
                  <p>
                    <strong>Symptoms:</strong> {record.symptoms.join(", ")}
                  </p>
                )}

                {record.mood && (
                  <p><strong>Mood:</strong> {record.mood}</p>
                )}

                {record.sleep && (
                  <p><strong>Sleep:</strong> {record.sleep}</p>
                )}

                {record.energy && (
                  <p><strong>Energy:</strong> {record.energy}</p>
                )}

                {record.notes && (
                  <p><strong>Notes:</strong> {record.notes}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-2">
        <article className="section-card">
          <h2>Patterns over time</h2>
          <p>
            These are counts from your saved records, not a medical diagnosis.
          </p>

          {topSymptoms.length === 0 ? (
            <p>Record symptoms in a check-in to start seeing patterns.</p>
          ) : (
            <ul>
              {topSymptoms.map(([symptom, count]) => (
                <li key={symptom}>
                  <strong>{symptom}</strong>: recorded {count}{" "}
                  {count === 1 ? "time" : "times"}
                </li>
              ))}
            </ul>
          )}

          <Link className="button" to="/menopause/insights">
            View all insights
          </Link>
        </article>

        <article className="section-card">
          <h2>Ongoing care</h2>
          <p>
            Keep questions and follow-up topics ready for your next healthcare
            appointment.
          </p>
          <Link className="button" to="/menopause/care">
            Manage care notes
          </Link>
        </article>
      </section>
    </main>
  );
}
