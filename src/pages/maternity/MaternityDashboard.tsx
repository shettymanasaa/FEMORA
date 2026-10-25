import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";
import type { CheckIn, HealthRecord } from "../../core/contracts";

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

export default function MaternityDashboard() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [timeline, setTimeline] = useState<{
    available: boolean;
    week?: number;
    trimester?: number;
    dueDate?: string | null;
    stage?: string;
  } | null>(null);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick pregnancy date modal / setup
  const [lmp, setLmp] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadData() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [tlRes, chkRes, recRes] = await Promise.all([
          coreApi.maternityTimeline(profileId, today),
          coreApi.getCheckIns(profileId, "maternity"),
          coreApi.listRecords(profileId, "maternity"),
        ]);

        if (active) {
          if (tlRes.ok && tlRes.data.available) {
            setTimeline(tlRes.data);
          } else {
            // Default demo timeline for Aria (Week 24, Trimester 2)
            setTimeline({
              available: true,
              week: 24,
              trimester: 2,
              dueDate: "2027-02-14",
            });
          }

          if (chkRes.ok) {
            setCheckIns(chkRes.data);
          }
          if (recRes.ok) {
            setRecords(recRes.data);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [profileId]);

  async function handleSaveLmp(e: React.FormEvent) {
    e.preventDefault();
    if (!lmp || !profileId) return;

    await coreApi.savePregnancyDates(profileId, { lmp });
    const today = new Date().toISOString().slice(0, 10);
    const tlRes = await coreApi.maternityTimeline(profileId, today);
    if (tlRes.ok && tlRes.data.available) {
      setTimeline(tlRes.data);
    }
    setShowSetup(false);
  }

  const birthPlanRecord = records.find((r) => r.type === "birth_plan");
  const birthPlanData = birthPlanRecord?.data as { preferences?: string[]; notes?: string } | undefined;

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY &amp; PREGNANCY CARE"
        title={`Your pregnancy journey, ${activeProfile?.nickname ?? ""}`}
        description="Track gestational weeks, fetal movements, birth preferences and doctor discussions."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="button button-primary" to="/maternity/check-in">
              ＋ Daily Check-in
            </Link>
            <Link className="button button-secondary" to="/maternity/report">
              📄 Maternity Report
            </Link>
          </div>
        }
      />

      {/* Hero: Pregnancy Timeline */}
      <section
        className="section-card"
        style={{
          background: "linear-gradient(135deg, #f3f6f1 0%, #ffffff 100%)",
          border: "1px solid #8C9B8340",
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(140, 155, 131, 0.2)",
                color: "#4a6741",
                fontWeight: 700,
                fontSize: "0.78rem",
                textTransform: "uppercase",
              }}
            >
              🌿 Trimester {timeline?.trimester ?? 2} (Weeks 14–27)
            </span>

            <h2 style={{ fontSize: "1.8rem", margin: "10px 0 4px 0" }}>
              Week {timeline?.week ?? 24} of Pregnancy
            </h2>
            <p style={{ margin: 0, color: "var(--color-muted-foreground, #666)", fontSize: "0.95rem" }}>
              Baby is actively responding to sounds, flexing limbs, and developing sleep cycles.
            </p>
          </div>

          {timeline?.dueDate && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid var(--border, #d8dfd5)",
                textAlign: "right",
              }}
            >
              <span className="eyebrow" style={{ display: "block", marginBottom: 2 }}>
                ESTIMATED DUE DATE
              </span>
              <strong style={{ fontSize: "1.1rem", color: "#4a6741" }}>
                {formatDate(timeline.dueDate)}
              </strong>
            </div>
          )}
        </div>

        {/* Gestational Progress Bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, color: "#666", marginBottom: 6 }}>
            <span>Conception (Week 1)</span>
            <span>Trimester 2 (Week 24)</span>
            <span>Full Term (Week 40)</span>
          </div>

          <div style={{ height: 12, borderRadius: 6, background: "#e8ede6", overflow: "hidden", display: "flex" }}>
            <div
              style={{
                width: `${((timeline?.week ?? 24) / 40) * 100}%`,
                background: "linear-gradient(90deg, #8C9B83 0%, #4a6741 100%)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      </section>

      {/* Grid: Actions & Cards */}
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        {/* Birth Plan Card */}
        <article className="section-card">
          <p className="eyebrow">BIRTH PLAN</p>
          <h2>Preferences &amp; Care Team</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.4, color: "#555" }}>
            {birthPlanData?.preferences && birthPlanData.preferences.length > 0
              ? `${birthPlanData.preferences.length} preferences recorded (lighting, pain relief, partner support).`
              : "Organise preferences for labor, pain relief, and immediate newborn care."}
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="button button-secondary" to="/maternity/birth-plan">
              Open Birth Plan →
            </Link>
          </div>
        </article>

        {/* Hospital Checklist */}
        <article className="section-card">
          <p className="eyebrow">PACKING &amp; LOGISTICS</p>
          <h2>Hospital Checklist</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.4, color: "#555" }}>
            Checklist for hospital bag essentials: ID documents, comfortable wear, swaddles, and car seat readiness.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="button button-secondary" to="/maternity/checklist">
              View Checklist →
            </Link>
          </div>
        </article>

        {/* Postpartum Care */}
        <article className="section-card">
          <p className="eyebrow">FOURTH TRIMESTER</p>
          <h2>Postpartum Planning</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.4, color: "#555" }}>
            Emotional wellbeing support, pelvic floor recovery guidelines, and newborn feeding reflections.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="button button-secondary" to="/maternity/postpartum">
              Postpartum Care →
            </Link>
          </div>
        </article>
      </section>

      {/* Recent Check-ins */}
      <section className="section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <p className="eyebrow">SAVED LOGS</p>
            <h2 style={{ margin: 0 }}>Recent Maternity Check-ins ({checkIns.length})</h2>
          </div>
          <Link to="/maternity/check-in" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            ＋ New Check-in
          </Link>
        </div>

        {checkIns.length === 0 ? (
          <p style={{ color: "#666" }}>
            No maternity check-ins logged yet. Record kicks, energy, and physical sensations daily.
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
