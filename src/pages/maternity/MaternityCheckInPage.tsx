import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";
import { evaluateSafety, type SafetyResult } from "../../safety";

const MATERNITY_SYMPTOMS = [
  { code: "fetal_movement", label: "Active fetal movements / kicks" },
  { code: "nausea", label: "Nausea or morning sickness" },
  { code: "fatigue", label: "Fatigue or exhaustion" },
  { code: "braxton_hicks", label: "Braxton Hicks contractions (mild, irregular)" },
  { code: "backache", label: "Lower backache" },
  { code: "pelvic_pressure", label: "Pelvic pressure" },
  { code: "heartburn", label: "Heartburn / acid reflux" },
  { code: "swelling_mild", label: "Mild ankle / feet swelling" },
  { code: "sleep_disturbed", label: "Restless sleep" },
  { code: "severe_headache", label: "Severe persistent headache", warning: true },
  { code: "visual_blurring", label: "Vision changes / spots", warning: true },
  { code: "vaginal_bleeding_active", label: "Vaginal bleeding or fluid leakage", warning: true },
  { code: "reduced_fetal_movement", label: "Noticeably reduced fetal movements", warning: true },
];

export default function MaternityCheckInPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<"pregnancy" | "postpartum">("pregnancy");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("2");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [safetyAlert, setSafetyAlert] = useState<SafetyResult | null>(null);

  function toggleSymptom(code: string) {
    setSelectedSymptoms((current) =>
      current.includes(code)
        ? current.filter((s) => s !== code)
        : [...current, code]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSafetyAlert(null);

    if (!profileId) {
      setError("Please select or activate a profile first.");
      return;
    }

    if (!date) {
      setError("Please choose the check-in date.");
      return;
    }

    const payload = {
      date,
      kind,
      symptoms: selectedSymptoms.map((code) => ({
        code,
        severity: Math.max(1, Math.min(10, Number(severity) || 1)),
      })),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    // 1. Evaluate Clinical Safety Rules
    try {
      const safety = evaluateSafety("maternity", {
        symptoms: selectedSymptoms,
        scores: { pain: Number(severity) || 0 },
      });
      if (safety.triggered && (safety.level === "urgent" || safety.level === "seek_care")) {
        setSafetyAlert(safety);
      }
    } catch {
      // Safety evaluation fail-closed
    }

    // 2. Persist to Core Engine
    try {
      const result = await coreApi.saveMaternityCheckIn(profileId, payload);
      if (!result.ok) {
        setError(result.message || "Unable to save maternity check-in.");
        return;
      }

      setSuccess("Your maternity check-in has been securely saved to this device.");
      setSelectedSymptoms([]);
      setNotes("");
    } catch {
      setError("Storage error. Check your browser database and try again.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY WELLBEING"
        title="Maternity Daily Check-in"
        description="Record baby kicks, physical comfort, symptoms and reflections. All records remain on your device."
        action={
          <Link className="button button-secondary" to="/maternity">
            ← Maternity Dashboard
          </Link>
        }
      />

      {safetyAlert && (
        <section
          className="section-card"
          style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            marginBottom: 20,
            borderRadius: 12,
          }}
          role="alert"
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.8rem" }}>⚠️</span>
            <div>
              <strong style={{ color: "#b91c1c", fontSize: "1.05rem" }}>
                Important Clinical Safety Alert ({safetyAlert.level.toUpperCase()})
              </strong>
              <p style={{ margin: "4px 0 10px 0", fontSize: "0.9rem", color: "#7f1d1d" }}>
                {safetyAlert.guidanceMessage || "One or more recorded symptoms match clinical guidelines requiring professional assessment."}
              </p>
              <p style={{ marginTop: 10, fontSize: "0.85rem", color: "#7f1d1d" }}>
                Reference: {safetyAlert.sourceId} ({safetyAlert.messageKey})
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="section-card" style={{ background: "#fef2f2", border: "1px solid #f87171", marginBottom: 16 }}>
          <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div className="section-card" style={{ background: "#f0fdf4", border: "1px solid #4ade80", marginBottom: 16 }}>
          <p style={{ color: "#15803d", margin: 0 }}>✓ {success}</p>
        </div>
      )}

      <form className="section-card" onSubmit={handleSubmit}>
        <div className="form-grid-two">
          <div className="field">
            <label htmlFor="maternity-date">Check-in Date</label>
            <input
              id="maternity-date"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="maternity-stage">Maternity Stage</label>
            <select
              id="maternity-stage"
              value={kind}
              onChange={(e) => setKind(e.target.value as "pregnancy" | "postpartum")}
            >
              <option value="pregnancy">Pregnancy (Trimester 1, 2, or 3)</option>
              <option value="postpartum">Postpartum (Recovery &amp; 4th Trimester)</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label><strong>Symptoms &amp; Sensations Today</strong></label>
          <p className="field-help" style={{ marginBottom: 10 }}>Select all that apply.</p>

          <div className="grid grid-2" style={{ gap: 8 }}>
            {MATERNITY_SYMPTOMS.map((symptom) => {
              const isChecked = selectedSymptoms.includes(symptom.code);
              return (
                <label
                  key={symptom.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: isChecked ? "1px solid #8C9B83" : "1px solid var(--border, #e5eae3)",
                    background: isChecked ? "#f0f5ee" : "var(--surface, #fff)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSymptom(symptom.code)}
                  />
                  <span style={{ fontSize: "0.85rem", color: symptom.warning ? "#b91c1c" : "inherit" }}>
                    {symptom.warning ? "⚠️ " : ""}{symptom.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="maternity-severity">Overall Discomfort Level (0 = none, 10 = severe)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              id="maternity-severity"
              type="range"
              min="0"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 700, width: 36, textAlign: "center" }}>{severity}/10</span>
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="maternity-notes">Personal Notes / Questions for Midwife</label>
          <textarea
            id="maternity-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record fetal movement timing, questions for your next appointment, or how you are feeling emotionally..."
            maxLength={2000}
          />
        </div>

        <div className="button-row" style={{ marginTop: 24 }}>
          <button className="button button-primary" type="submit">
            Save Maternity Check-in →
          </button>
          <Link className="button button-secondary" to="/maternity">
            Back to Dashboard
          </Link>
        </div>
      </form>
    </main>
  );
}
