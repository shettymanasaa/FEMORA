import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";
import type { CheckIn } from "../../core/contracts";

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

export default function MenopauseDashboard() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [trends, setTrends] = useState<{ symptom: string; count: number; meanSeverity: number | null }[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadData() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [trRes, chkRes] = await Promise.all([
          coreApi.menopauseTrends(profileId, 30, today),
          coreApi.getCheckIns(profileId, "menopause"),
        ]);

        if (active) {
          if (trRes.ok && Array.isArray(trRes.data)) {
            setTrends(trRes.data);
          } else {
            // Default demo trends for Elena
            setTrends([
              { symptom: "hot_flashes", count: 4, meanSeverity: 6 },
              { symptom: "night_sweats", count: 3, meanSeverity: 5 },
              { symptom: "sleep_disturbances", count: 3, meanSeverity: 7 },
            ]);
          }

          if (chkRes.ok) {
            setCheckIns(chkRes.data);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [profileId]);

  return (
    <main>
      <PageHeader
        eyebrow="MENOPAUSE &amp; PERIMENOPAUSE"
        title={`Your wellbeing, ${activeProfile?.nickname ?? ""}`}
        description="Track vasomotor symptoms, sleep quality, bone health discussions, and personalized care plans."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="button button-primary" to="/menopause/check-in">
              ＋ Daily Check-in
            </Link>
            <Link className="button button-secondary" to="/menopause/report">
              📄 Menopause Report
            </Link>
          </div>
        }
      />

      {/* Hero Overview */}
      <section
        className="section-card"
        style={{
          background: "linear-gradient(135deg, #f8f4fb 0%, #ffffff 100%)",
          border: "1px solid #B69BC840",
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(182, 155, 200, 0.2)",
            color: "#6b4885",
            fontWeight: 700,
            fontSize: "0.78rem",
            textTransform: "uppercase",
          }}
        >
          🪻 Transition Tracking Active
        </span>

        <h2 style={{ fontSize: "1.8rem", margin: "10px 0 6px 0" }}>
          Perimenopause &amp; Menopause Insights
        </h2>
        <p style={{ margin: 0, color: "#555", fontSize: "0.95rem", maxWidth: 680, lineHeight: 1.5 }}>
          Tracking hormone fluctuations helps you connect physical sensations (flashes, mood shifts, joint stiffness)
          with lifestyle triggers and empowers evidence-based discussions with your clinician.
        </p>

        <div className="button-row" style={{ marginTop: 20 }}>
          <Link className="button button-primary" to="/menopause/check-in">
            Record Today&apos;s Check-in →
          </Link>
          <Link className="button button-secondary" to="/menopause/insights">
            View 30-Day Symptom Trends
          </Link>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        <article className="section-card">
          <p className="eyebrow">VASOMOTOR LOGS (30 DAYS)</p>
          <p className="stat-number" style={{ color: "#6b4885" }}>
            {trends.find((t) => t.symptom === "hot_flashes")?.count ?? 0}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", fontWeight: 600 }}>
            Hot Flash Occurrences
          </p>
          <small style={{ color: "#666" }}>
            Avg intensity: {trends.find((t) => t.symptom === "hot_flashes")?.meanSeverity?.toFixed(1) ?? "—"} / 10
          </small>
        </article>

        <article className="section-card">
          <p className="eyebrow">SLEEP QUALITY LOGS</p>
          <p className="stat-number" style={{ color: "#3b5e34" }}>
            {trends.find((t) => t.symptom === "sleep_disturbances")?.count ?? 0}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", fontWeight: 600 }}>
            Restless Sleep Entries
          </p>
          <small style={{ color: "#666" }}>
            Correlated with nocturnal vasomotor surges.
          </small>
        </article>

        <article className="section-card">
          <p className="eyebrow">CLINICAL CARE PLAN</p>
          <h2>Doctor Topics</h2>
          <p style={{ fontSize: "0.85rem", color: "#555", margin: "4px 0 12px 0" }}>
            Hormone therapy options, non-hormonal SSRI/gabapentin alternatives, and DEXA bone density screening.
          </p>
          <Link className="button button-secondary" to="/menopause/care">
            Open Care Plan →
          </Link>
        </article>
      </section>

      {/* Recent Check-ins */}
      <section className="section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <p className="eyebrow">SAVED ACTIVITY</p>
            <h2 style={{ margin: 0 }}>Recent Menopause Check-ins ({checkIns.length})</h2>
          </div>
          <Link to="/menopause/check-in" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            ＋ New Entry
          </Link>
        </div>

        {checkIns.length === 0 ? (
          <p style={{ color: "#666" }}>
            No menopause check-ins saved yet. Log daily to notice vasomotor patterns and triggers.
          </p>
        ) : (
          <div className="list-stack">
            {checkIns.slice(0, 5).map((chk) => (
              <article className="list-row" key={chk.id}>
                <div className="list-row-content">
                  <strong>{formatDate(chk.date)}</strong>
                  <p>
                    Symptoms:{" "}
                    {chk.symptoms && chk.symptoms.length > 0
                      ? chk.symptoms.map((s) => s.code.replace(/_/g, " ")).join(", ")
                      : "General check-in"}
                  </p>
                  {typeof (chk.data as Record<string, unknown>)?.notes === "string" && (
                    <p style={{ fontStyle: "italic", color: "#666" }}>
                      &ldquo;{String((chk.data as Record<string, unknown>).notes)}&rdquo;
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
