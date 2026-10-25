import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

const COMMON_PREFERENCES = [
  "Dim lighting and quiet atmosphere in delivery room",
  "Freedom of movement and changing labor positions",
  "Use of birthing ball and warm shower / hydrotherapy",
  "Delayed cord clamping (minimum 60 seconds)",
  "Immediate uninterrupted skin-to-skin contact",
  "Partner presence throughout labor and delivery",
  "Desire unmedicated labor if possible; discuss options",
  "Epidural available on request",
  "Avoid routine episiotomy unless clinically necessary",
  "Initiate breastfeeding within the first hour",
];

export default function BirthPlanPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [preferences, setPreferences] = useState<string[]>([]);
  const [customPref, setCustomPref] = useState("");
  const [notes, setNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadPlan() {
      setLoading(true);
      try {
        const res = await coreApi.listRecords(profileId, "maternity");
        if (active && res.ok) {
          const planRecord = res.data.find((r) => r.type === "birth_plan");
          if (planRecord && typeof planRecord.data === "object" && planRecord.data !== null) {
            const d = planRecord.data as { preferences?: string[]; notes?: string };
            if (Array.isArray(d.preferences)) setPreferences(d.preferences);
            if (typeof d.notes === "string") setNotes(d.notes);
          } else {
            // Default initial selections
            setPreferences([
              "Dim lighting and quiet atmosphere in delivery room",
              "Delayed cord clamping (minimum 60 seconds)",
              "Immediate uninterrupted skin-to-skin contact",
            ]);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      active = false;
    };
  }, [profileId]);

  function togglePreference(item: string) {
    setPreferences((current) =>
      current.includes(item)
        ? current.filter((p) => p !== item)
        : [...current, item]
    );
    setSavedSuccess("");
  }

  function addCustomPreference(e: React.FormEvent) {
    e.preventDefault();
    const clean = customPref.trim();
    if (!clean) return;
    if (!preferences.includes(clean)) {
      setPreferences((current) => [...current, clean]);
    }
    setCustomPref("");
    setSavedSuccess("");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSavedSuccess("");

    if (!profileId) {
      setError("Please select an active profile.");
      return;
    }

    try {
      const res = await coreApi.saveBirthPlan(profileId, {
        preferences,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      if (!res.ok) {
        setError(res.message || "Failed to save birth plan.");
        return;
      }

      setSavedSuccess("Birth plan saved to your device. Ready to discuss with your obstetrician / midwife.");
    } catch {
      setError("Database storage error. Please try again.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY PREPARATION"
        title="Your Birth Plan &amp; Preferences"
        description="Clarify and document your personal wishes for labor, delivery, and immediate newborn care to review with your team."
        action={
          <Link className="button button-secondary" to="/maternity">
            ← Maternity Dashboard
          </Link>
        }
      />

      {savedSuccess && (
        <div className="section-card" style={{ background: "#f0fdf4", border: "1px solid #4ade80", marginBottom: 16 }}>
          <p style={{ color: "#15803d", margin: 0 }}>✓ {savedSuccess}</p>
        </div>
      )}

      {error && (
        <div className="section-card" style={{ background: "#fef2f2", border: "1px solid #f87171", marginBottom: 16 }}>
          <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSave}>
        <section className="section-card" style={{ marginBottom: 20 }}>
          <p className="eyebrow">LABOR &amp; DELIVERY PREFERENCES</p>
          <h2>Select Preferences ({preferences.length} selected)</h2>
          <p style={{ color: "#666", fontSize: "0.88rem", marginBottom: 16 }}>
            These serve as conversational prompts for your birth team. Unforeseen medical necessities always take priority.
          </p>

          <div className="list-stack" style={{ gap: 8 }}>
            {COMMON_PREFERENCES.map((pref) => {
              const isChecked = preferences.includes(pref);
              return (
                <label
                  key={pref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: isChecked ? "1px solid #8C9B83" : "1px solid var(--border, #e5eae3)",
                    background: isChecked ? "#f0f5ee" : "var(--surface, #fff)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePreference(pref)}
                  />
                  <span style={{ fontSize: "0.9rem" }}>{pref}</span>
                </label>
              );
            })}
          </div>

          {/* Add custom preference */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <input
              type="text"
              value={customPref}
              onChange={(e) => setCustomPref(e.target.value)}
              placeholder="Add your own custom preference..."
              maxLength={200}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="button button-secondary"
              onClick={addCustomPreference}
            >
              ＋ Add
            </button>
          </div>
        </section>

        <section className="section-card" style={{ marginBottom: 20 }}>
          <p className="eyebrow">NOTES FOR YOUR CARE TEAM</p>
          <h2>Special Considerations &amp; Questions</h2>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSavedSuccess("");
            }}
            placeholder="e.g. Allergies, previous birth experiences, cultural or religious considerations, music playlist wishes..."
            maxLength={2000}
          />
        </section>

        <div className="button-row">
          <button className="button button-primary" type="submit">
            Save Birth Plan →
          </button>
          <Link className="button button-secondary" to="/maternity/report">
            View Maternity Report
          </Link>
        </div>
      </form>
    </main>
  );
}
