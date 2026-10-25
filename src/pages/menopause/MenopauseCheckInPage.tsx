import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";
import { evaluateSafety, type SafetyResult } from "../../safety";

const MENOPAUSE_SYMPTOMS = [
  { code: "hot_flashes", label: "Hot flashes / vasomotor surges" },
  { code: "night_sweats", label: "Night sweats / nocturnal awakening" },
  { code: "sleep_disturbances", label: "Sleep disturbances / insomnia" },
  { code: "mood_changes", label: "Mood changes, anxiety, or irritability" },
  { code: "brain_fog", label: "Brain fog / concentration lapses" },
  { code: "fatigue", label: "Daytime fatigue or exhaustion" },
  { code: "joint_aches", label: "Joint stiffness or musculoskeletal aches" },
  { code: "vaginal_dryness", label: "Vaginal dryness or discomfort" },
  { code: "headache", label: "Headache or migraine" },
  { code: "postmenopausal_bleeding", label: "Unexpected postmenopausal bleeding or spotting", warning: true },
];

export default function MenopauseCheckInPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("3");
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
      kind: "menopause" as const,
      symptoms: selectedSymptoms.map((code) => ({
        code,
        severity: Math.max(1, Math.min(10, Number(severity) || 1)),
      })),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    // 1. Evaluate Clinical Safety Rules
    try {
      const safety = evaluateSafety("menopause", {
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
      const result = await coreApi.saveMenopauseCheckIn(profileId, payload);
      if (!result.ok) {
        setError(result.message || "Unable to save menopause check-in.");
        return;
      }

      setSuccess("Your menopause check-in has been securely saved to this device.");
      setSelectedSymptoms([]);
      setNotes("");
    } catch {
      setError("Storage error. Check your browser database and try again.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="MENOPAUSE WELLBEING"
        title="Menopause Daily Check-in"
        description="Track vasomotor symptoms, sleep quality, and mood changes to observe personal trends."
        action={
          <Link className="button button-secondary" to="/menopause">
            ← Menopause Dashboard
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
                {safetyAlert.guidanceMessage || "One or more recorded symptoms match clinical safety guidelines requiring prompt professional evaluation."}
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
        <div className="field">
          <label htmlFor="menopause-date">Check-in Date</label>
          <input
            id="menopause-date"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label><strong>Symptoms Experienced Today</strong></label>
          <p className="field-help" style={{ marginBottom: 10 }}>Select all that occurred.</p>

          <div className="grid grid-2" style={{ gap: 8 }}>
            {MENOPAUSE_SYMPTOMS.map((symptom) => {
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
                    border: isChecked ? "1px solid #B69BC8" : "1px solid var(--border, #e5eae3)",
                    background: isChecked ? "#f6f1fa" : "var(--surface, #fff)",
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
          <label htmlFor="menopause-severity">Overall Symptom Intensity (0 = none, 10 = severe)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              id="menopause-severity"
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
          <label htmlFor="menopause-notes">Personal Notes &amp; Observations</label>
          <textarea
            id="menopause-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record hot flash triggers (spicy food, coffee, stress), sleep quality, or reflections..."
            maxLength={2000}
          />
        </div>

        <div className="button-row" style={{ marginTop: 24 }}>
          <button className="button button-primary" type="submit">
            Save Menopause Check-in →
          </button>
          <Link className="button button-secondary" to="/menopause">
            Back to Dashboard
          </Link>
        </div>
      </form>
    </main>
  );
}
