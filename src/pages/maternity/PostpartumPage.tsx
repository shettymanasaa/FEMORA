import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

export default function PostpartumPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [birthDate, setBirthDate] = useState("");
  const [transitioned, setTransitioned] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!profileId) return;

    async function checkStatus() {
      const today = new Date().toISOString().slice(0, 10);
      const res = await coreApi.maternityTimeline(profileId, today);
      if (active && res.ok && res.data.available && 'stage' in res.data && res.data.stage === "postpartum") {
        setTransitioned(true);
        if ('postpartumStartedAt' in res.data && typeof res.data.postpartumStartedAt === 'string') {
          setBirthDate(res.data.postpartumStartedAt);
        }
      }
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, [profileId]);

  async function handleTransition(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!birthDate || !profileId) {
      setError("Please select the baby's birth date.");
      return;
    }

    try {
      const res = await coreApi.transitionToPostpartum(profileId, birthDate);
      if (!res.ok) {
        setError(res.message || "Failed to update postpartum status.");
        return;
      }

      setTransitioned(true);
      setMessage("Profile successfully transitioned to Postpartum care. All pregnancy records remain preserved.");
    } catch {
      setError("Error updating stage. Please try again.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="FOURTH TRIMESTER"
        title="Postpartum Recovery &amp; Care"
        description="A gentle space to record physical recovery, emotional wellbeing, and follow-up topics after delivery."
        action={
          <Link className="button button-secondary" to="/maternity">
            ← Maternity Dashboard
          </Link>
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

      {/* Postpartum Transition Card */}
      {!transitioned ? (
        <section className="section-card" style={{ marginBottom: 20 }}>
          <p className="eyebrow">STAGE TRANSITION</p>
          <h2>Welcome Your Baby &amp; Begin Postpartum Care</h2>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 16 }}>
            Recording the birth date transitions this profile to postpartum recovery guidance.
            All gestational check-ins and ultrasound history will remain intact.
          </p>

          <form onSubmit={handleTransition} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="baby-birth-date">Baby&apos;s Birth Date</label>
              <input
                id="baby-birth-date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="button button-primary">
              Begin Postpartum Recovery →
            </button>
          </form>
        </section>
      ) : (
        <section className="section-card" style={{ background: "#f5f9f3", border: "1px solid #c4d8be", marginBottom: 20 }}>
          <p className="eyebrow">POSTPARTUM STATUS ACTIVE</p>
          <h2 style={{ color: "#2d5a27" }}>Recovery Stage: Active</h2>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Birth date recorded: <strong>{birthDate}</strong>. Focusing on pelvic rest, nourishment, and emotional stabilization.
          </p>
        </section>
      )}

      {/* Recovery Guidance Grid */}
      <section className="grid grid-2" style={{ gap: 16, marginBottom: 24 }}>
        <article className="section-card">
          <p className="eyebrow">PHYSICAL RECOVERY</p>
          <h2>Pelvic Floor &amp; Healing</h2>
          <ul style={{ paddingLeft: 20, margin: "10px 0", fontSize: "0.88rem", lineHeight: 1.6, color: "#444" }}>
            <li>Lochia (postpartum discharge) gradually transitions from bright red to pink/brown and yellowish-white over 2–6 weeks.</li>
            <li>Ice packs, witch hazel pads, and warm sitz baths soothe perineal tissue.</li>
            <li>Prioritize horizontal rest during the first two weeks to support pelvic organ positioning.</li>
          </ul>
        </article>

        <article className="section-card">
          <p className="eyebrow">EMOTIONAL HEALTH</p>
          <h2>Baby Blues vs. PPD Support</h2>
          <ul style={{ paddingLeft: 20, margin: "10px 0", fontSize: "0.88rem", lineHeight: 1.6, color: "#444" }}>
            <li>Mild mood swings and tearfulness (&ldquo;baby blues&rdquo;) are very common in the first 10–14 days due to acute hormone drops.</li>
            <li>If sadness, severe anxiety, numbness, or intrusive thoughts persist beyond 2 weeks, contact your clinician.</li>
            <li>Postpartum Support International helpline is confidential and available 24/7.</li>
          </ul>
        </article>
      </section>

      <div className="button-row">
        <Link className="button button-primary" to="/maternity/check-in">
          Record Postpartum Check-in →
        </Link>
        <Link className="button button-secondary" to="/maternity/report">
          View Health Summary
        </Link>
      </div>
    </main>
  );
}
