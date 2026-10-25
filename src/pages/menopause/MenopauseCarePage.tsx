import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";
import type { HealthRecord } from "../../core/contracts";

export default function MenopauseCarePage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [treatment, setTreatment] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [treatments, setTreatments] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function loadRecords() {
      setLoading(true);
      try {
        const res = await coreApi.listRecords(profileId, "menopause");
        if (active && res.ok) {
          const qs: string[] = [];
          const trs: string[] = [];

          res.data.forEach((r) => {
            if (r.type === "doctor_question") {
              const d = r.data as { question?: string };
              if (d.question) qs.push(d.question);
            } else if (r.type === "treatment_history") {
              const d = r.data as { treatment?: string; notes?: string };
              if (d.treatment) trs.push(d.treatment + (d.notes ? ` (${d.notes})` : ""));
            }
          });

          if (qs.length > 0) setQuestions(qs);
          else setQuestions(["Is Menopausal Hormone Therapy (MHT) suitable for my personal health history?", "When should I schedule my next DEXA bone mineral density scan?"]);

          if (trs.length > 0) setTreatments(trs);
          else setTreatments(["Transdermal estradiol 0.05mg patch + micronized progesterone 100mg nightly", "Daily Vitamin D3 1000 IU + Calcium citrate 600mg"]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();
    return () => {
      active = false;
    };
  }, [profileId]);

  async function handleAddQuestion(e: FormEvent) {
    e.preventDefault();
    const clean = newQuestion.trim();
    if (!clean || !profileId) return;

    setError("");
    setMessage("");

    const res = await coreApi.addMenopauseDoctorQuestion(profileId, { question: clean });
    if (res.ok) {
      setQuestions((current) => [...current, clean]);
      setNewQuestion("");
      setMessage("Question added to your care visit list.");
    } else {
      setError("Failed to save question.");
    }
  }

  async function handleAddTreatment(e: FormEvent) {
    e.preventDefault();
    const clean = treatment.trim();
    if (!clean || !profileId) return;

    setError("");
    setMessage("");

    const res = await coreApi.saveTreatmentHistory(profileId, {
      treatment: clean,
      ...(treatmentNotes.trim() ? { notes: treatmentNotes.trim() } : {}),
    });

    if (res.ok) {
      setTreatments((current) => [...current, clean + (treatmentNotes.trim() ? ` (${treatmentNotes.trim()})` : "")]);
      setTreatment("");
      setTreatmentNotes("");
      setMessage("Treatment record updated.");
    } else {
      setError("Failed to save treatment.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="ONGOING HEALTHCARE"
        title="Doctor Topics &amp; Treatment History"
        description="Organize questions for your next gynecologist or primary care visit and keep a record of therapies."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="button button-secondary" to="/menopause">
              ← Menopause Dashboard
            </Link>
            <Link className="button button-primary" to="/menopause/report">
              📄 Export Report
            </Link>
          </div>
        }
      />

      {message && (
        <div className="section-card" style={{ background: "#f0fdf4", border: "1px solid #4ade80", marginBottom: 16 }}>
          <p style={{ color: "#15803d", margin: 0 }}>✓ {message}</p>
        </div>
      )}

      {error && (
        <div className="section-card" style={{ background: "#fef2f2", border: "1px solid #f87171", marginBottom: 16 }}>
          <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Doctor Questions Card */}
      <section className="section-card" style={{ marginBottom: 20 }}>
        <p className="eyebrow">APPOINTMENT PREPARATION</p>
        <h2>Questions for Your Healthcare Professional ({questions.length})</h2>
        <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 16 }}>
          Bring these questions to your next appointment:
        </p>

        <ul style={{ paddingLeft: 20, margin: "0 0 16px 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {questions.map((q, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>
              {q}
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddQuestion} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type a new question to ask your doctor..."
            maxLength={1000}
            style={{ flex: 1 }}
          />
          <button type="submit" className="button button-secondary">
            ＋ Add Question
          </button>
        </form>
      </section>

      {/* Treatment History Card */}
      <section className="section-card" style={{ marginBottom: 20 }}>
        <p className="eyebrow">THERAPY &amp; MEDICATION RECORD</p>
        <h2>Current Treatments &amp; Supplements ({treatments.length})</h2>

        <ul style={{ paddingLeft: 20, margin: "10px 0 16px 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {treatments.map((t, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>
              {t}
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddTreatment} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="form-grid-two">
            <input
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g. Transdermal Estradiol 0.05mg patch"
              maxLength={200}
              required
            />
            <input
              type="text"
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              placeholder="Notes (e.g. Started Sept 2026, well-tolerated)"
              maxLength={2000}
            />
          </div>
          <div>
            <button type="submit" className="button button-secondary">
              ＋ Record Treatment
            </button>
          </div>
        </form>
      </section>

      <div className="button-row">
        <Link className="button button-primary" to="/menopause/report">
          Generate Clinician Report →
        </Link>
        <Link className="button button-secondary" to="/menopause">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
