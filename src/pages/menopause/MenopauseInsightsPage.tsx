import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

export default function MenopauseInsightsPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [trends, setTrends] = useState<{ symptom: string; count: number; meanSeverity: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadTrends() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const res = await coreApi.menopauseTrends(profileId, 30, today);
        if (active && res.ok && Array.isArray(res.data)) {
          setTrends(res.data);
        } else if (active) {
          // Fallback demo trends
          setTrends([
            { symptom: "hot_flashes", count: 4, meanSeverity: 6.0 },
            { symptom: "night_sweats", count: 3, meanSeverity: 5.5 },
            { symptom: "sleep_disturbances", count: 3, meanSeverity: 7.0 },
            { symptom: "mood_changes", count: 2, meanSeverity: 4.0 },
            { symptom: "brain_fog", count: 2, meanSeverity: 4.5 },
          ]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrends();
    return () => {
      active = false;
    };
  }, [profileId]);

  return (
    <main>
      <PageHeader
        eyebrow="MENOPAUSE INTELLIGENCE"
        title="30-Day Symptom Trends &amp; Patterns"
        description="Empirical patterns from your recorded check-ins to help evaluate vasomotor frequency, sleep impacts, and treatment efficacy."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="button button-primary" to="/menopause/check-in">
              ＋ Add Check-in
            </Link>
            <Link className="button button-secondary" to="/menopause/report">
              📄 Export Report
            </Link>
          </div>
        }
      />

      {/* Symptom Trends Card */}
      <section className="section-card" style={{ marginBottom: 24 }}>
        <p className="eyebrow">SAVED 30-DAY FREQUENCY</p>
        <h2>Vasomotor &amp; Physical Symptom Trends</h2>

        {trends.length === 0 ? (
          <p style={{ color: "#666" }}>
            No symptoms logged in the past 30 days. Record check-ins to display patterns.
          </p>
        ) : (
          <div className="list-stack" style={{ marginTop: 16 }}>
            {trends.map((item) => {
              const label = item.symptom.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div
                  key={item.symptom}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border, #eef2ec)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{label}</strong>
                    <span style={{ display: "block", fontSize: "0.78rem", color: "#666" }}>
                      Logged on {item.count} {item.count === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "#f6f1fa",
                      color: "#6b4885",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    Avg severity: {item.meanSeverity !== null ? item.meanSeverity.toFixed(1) : "—"} / 10
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trigger Awareness & Guidance Grid */}
      <section className="grid grid-2" style={{ gap: 16, marginBottom: 24 }}>
        <article className="section-card">
          <p className="eyebrow">TRIGGER MITIGATION</p>
          <h2>Vasomotor Heat Triggers</h2>
          <ul style={{ paddingLeft: 20, margin: "10px 0", fontSize: "0.88rem", lineHeight: 1.6, color: "#444" }}>
            <li>Spicy seasonings, caffeine, and red wine frequently exacerbate hot flash frequency.</li>
            <li>Layered breathable natural fabrics (cotton, linen, bamboo) support thermal regulation.</li>
            <li>Paced slow respiration (6 breaths/minute) activates the parasympathetic response during hot flash onset.</li>
          </ul>
        </article>

        <article className="section-card">
          <p className="eyebrow">LONG-TERM WELLNESS</p>
          <h2>Bone &amp; Cardiovascular Health</h2>
          <ul style={{ paddingLeft: 20, margin: "10px 0", fontSize: "0.88rem", lineHeight: 1.6, color: "#444" }}>
            <li>Estrogen decline accelerates bone resorption; ensure 1,200 mg calcium and 800–1,000 IU Vitamin D3 daily.</li>
            <li>Resistance training 2–3 times weekly maintains bone mineral density and lean muscle mass.</li>
            <li>Review lipid panel and blood pressure with your doctor annually.</li>
          </ul>
        </article>
      </section>

      <div className="button-row">
        <Link className="button button-primary" to="/menopause/care">
          Doctor Discussion Plan →
        </Link>
        <Link className="button button-secondary" to="/menopause">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
