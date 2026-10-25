import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function ProfilePickerPage() {
  const { profiles, selectProfile, deleteProfile, loadDemoProfiles, loginAsDemoPersona } = useAppContext();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const navigate = useNavigate();

  function openProfile(profileId: string) {
    selectProfile(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (profile?.journey) {
      navigate("/home");
    } else {
      navigate("/onboarding");
    }
  }

  async function handleQuickDemoLogin(persona: "menstrual" | "maternity" | "menopause") {
    setLoadingDemo(true);
    try {
      await loginAsDemoPersona(persona);
      if (persona === "menstrual") {
        navigate("/menstrual");
      } else if (persona === "maternity") {
        navigate("/maternity/dashboard");
      } else {
        navigate("/menopause/dashboard");
      }
    } finally {
      setLoadingDemo(false);
    }
  }

  async function handleLoadAllDemo() {
    setLoadingDemo(true);
    try {
      await loadDemoProfiles();
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <main className="standalone-page">
      <div className="standalone-brand">
        <Link className="brand" to="/">
          <img
            className="brand-logo"
            src="/assets/logo/femora-mark.png"
            alt="FEMORA"
          />
          <span>
            <strong>FEMORA</strong>
            <small>Care for every phase of her life.</small>
          </span>
        </Link>
      </div>

      <div className="standalone-content">
        <PageHeader
          eyebrow="PROFILE SOCKET • ONLY PROFILE REQUIRED"
          title="Connect your profile socket"
          description="FEMORA is 100% local-first. Only your profile is required to log in — no passwords, emails, or cloud accounts."
        />

        {/* ============================================================= */}
        {/* Quick Demo Dataset Log In Section                             */}
        {/* ============================================================= */}
        <section className="section-card" style={{ marginBottom: 28, border: "1px solid var(--color-sage-300, #c4d1c0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span className="article-category">EVALUATION & DEMO DATASETS</span>
              <h2 style={{ margin: "4px 0 6px 0" }}>Quick Log In with Test Personas</h2>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-muted-foreground, #666)" }}>
                Pre-populated with clinical check-ins, symptoms, appointments, and birth plans.
              </p>
            </div>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleLoadAllDemo}
              disabled={loadingDemo}
            >
              {loadingDemo ? "Loading datasets..." : "✨ Seed All 3 Personas"}
            </button>
          </div>

          <div className="grid grid-3" style={{ marginTop: 16 }}>
            {/* Persona 1: Priya */}
            <article className="section-card" style={{ padding: "16px", background: "var(--color-surface, #fff)" }}>
              <span style={{ fontSize: "1.6rem" }} aria-hidden="true">🌸</span>
              <h3 style={{ margin: "6px 0 2px 0" }}>Priya Sharma</h3>
              <p style={{ fontSize: "0.85rem", color: "#C77D88", fontWeight: 600 }}>Menstrual Health (Age 26)</p>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.4, margin: "6px 0 12px 0" }}>
                2-month cycle logs, Day 29 cycle length, cramp &amp; flow check-ins, gynecologist appointment.
              </p>
              <button
                type="button"
                className="button button-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleQuickDemoLogin("menstrual")}
                disabled={loadingDemo}
              >
                Log in as Priya →
              </button>
            </article>

            {/* Persona 2: Aria */}
            <article className="section-card" style={{ padding: "16px", background: "var(--color-surface, #fff)" }}>
              <span style={{ fontSize: "1.6rem" }} aria-hidden="true">🌿</span>
              <h3 style={{ margin: "6px 0 2px 0" }}>Aria Chen</h3>
              <p style={{ fontSize: "0.85rem", color: "#8C9B83", fontWeight: 600 }}>Maternity Care (Week 24)</p>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.4, margin: "6px 0 12px 0" }}>
                Trimester 2 kicks, hospital checklist, birth plan preferences, fetal anatomy ultrasound.
              </p>
              <button
                type="button"
                className="button button-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleQuickDemoLogin("maternity")}
                disabled={loadingDemo}
              >
                Log in as Aria →
              </button>
            </article>

            {/* Persona 3: Elena */}
            <article className="section-card" style={{ padding: "16px", background: "var(--color-surface, #fff)" }}>
              <span style={{ fontSize: "1.6rem" }} aria-hidden="true">🪻</span>
              <h3 style={{ margin: "6px 0 2px 0" }}>Elena Rostova</h3>
              <p style={{ fontSize: "0.85rem", color: "#B69BC8", fontWeight: 600 }}>Perimenopause (Age 51)</p>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.4, margin: "6px 0 12px 0" }}>
                Vasomotor logs (hot flashes, night sweats), sleep quality ratings, DEXA bone scan.
              </p>
              <button
                type="button"
                className="button button-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleQuickDemoLogin("menopause")}
                disabled={loadingDemo}
              >
                Log in as Elena →
              </button>
            </article>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Standard Local Profile List                                   */}
        {/* ============================================================= */}
        <h2>Your Local Profiles ({profiles.length})</h2>

        {profiles.length === 0 ? (
          <section className="section-card empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ♡
            </span>
            <h3>No custom profiles yet</h3>
            <p>
              Create a custom local profile to begin from scratch, or choose one of the test personas above.
            </p>
            <Link className="button button-primary" to="/profiles/new">
              + Create new profile
            </Link>
          </section>
        ) : (
          <div className="list-stack">
            {profiles.map((profile) => (
              <article className="profile-card" key={profile.id}>
                <span
                  className="avatar"
                  style={{ backgroundColor: profile.avatarColor }}
                  aria-hidden="true"
                >
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>

                <div className="list-row-content">
                  <h3>{profile.nickname}</h3>
                  <p>
                    {profile.journey
                      ? `Active Journey: ${profile.journey.toUpperCase()}`
                      : "Choose a journey to get started"}
                    {profile.isSample ? " · Sample Persona" : ""}
                  </p>
                </div>

                <div className="profile-card-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => openProfile(profile.id)}
                  >
                    Open →
                  </button>

                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}

            <div className="button-row" style={{ marginTop: 12 }}>
              <Link className="button button-secondary" to="/profiles/new">
                + Create another profile
              </Link>
            </div>
          </div>
        )}

        <div className="notice notice-sage" style={{ marginTop: 24 }}>
          <strong>Privacy &amp; Local Storage:</strong>
          <p>
            All profiles, check-in logs, and health documents are stored on-device in your browser&apos;s IndexedDB. No external account or remote password is required.
          </p>
        </div>
      </div>
    </main>
  );
}
