
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../ui/common/PageHeader";
import { useAppContext } from "../app/providers";

export default function SettingsPage() {
  const { theme, setTheme, clearActiveProfile, activeProfile } = useAppContext();
  const navigate = useNavigate();
  const [dob, setDob] = useState("");
  const [dobMessage, setDobMessage] = useState("");

  useEffect(() => {
    if (!activeProfile) {
      setDob("");
      return;
    }
    setDob(localStorage.getItem(`femora.profile-dob.${activeProfile.id}`) ?? "");
    setDobMessage("");
  }, [activeProfile?.id]);

  function saveDob() {
    if (!activeProfile) return;
    if (!dob || dob > new Date().toISOString().slice(0, 10)) {
      setDobMessage("Enter a valid date of birth that is not in the future.");
      return;
    }

    try {
      localStorage.setItem(`femora.profile-dob.${activeProfile.id}`, dob);
      setDobMessage("Date of birth saved on this device.");
    } catch {
      setDobMessage("Could not save the date of birth. Check browser storage.");
    }
  }

  return (
    <div className="settings-page">
      <PageHeader
        eyebrow="YOUR SPACE"
        title="Profile & settings"
        description="Manage your profile, appearance and privacy information."
      />

      <section className="section-card">
        <div className="section-card-heading">
          <h2>Current profile</h2>
          <p>Your active local profile.</p>
        </div>
        <div className="settings-link">
          <div className="settings-profile-summary">
            <span className="avatar" style={{ backgroundColor: activeProfile?.avatarColor ?? "#b34a5b" }} aria-hidden="true">
              {activeProfile?.nickname.charAt(0).toUpperCase() ?? "F"}
            </span>
            <div>
              <strong>{activeProfile?.nickname ?? "No active profile"}</strong>
              <p>{activeProfile?.journey ? `Journey: ${activeProfile.journey}` : "No journey selected"}</p>
            </div>
          </div>
          <Link className="button button-secondary" to="/profiles">Manage profiles</Link>
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="settings-dob">Date of birth</label>
          <input
            id="settings-dob"
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => { setDob(event.target.value); setDobMessage(""); }}
            disabled={!activeProfile}
          />
          <p className="field-help">
            Used for the Sexual Wellbeing 18+ restriction. This is self-declared
            and is not identity verification.
          </p>
          <button className="button button-secondary" type="button" onClick={saveDob} disabled={!activeProfile}>
            Save date of birth
          </button>
          {dobMessage && <p role="status">{dobMessage}</p>}
        </div>
      </section>

      <section className="section-card settings-section">
        <div className="section-card-heading">
          <h2>Appearance</h2>
          <p>Choose the theme that feels comfortable to use.</p>
        </div>
        <div className="field">
          <label htmlFor="theme-setting">Colour theme</label>
          <select id="theme-setting" value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">Use system preference</option>
          </select>
        </div>
      </section>

      <section className="section-card settings-section">
        <div className="section-card-heading">
          <h2>Privacy & information</h2>
          <p>Review how this version handles local information.</p>
        </div>

        <div className="settings-link">
          <div><strong>Privacy controls</strong><p>Review local data and available privacy options.</p></div>
          <Link className="button button-secondary" to="/settings/privacy">Open</Link>
        </div>
        <div className="settings-link">
          <div><strong>Health history</strong><p>Open your health history page.</p></div>
          <Link className="button button-secondary" to="/profile/health-history">View</Link>
        </div>
        <div className="settings-link">
          <div><strong>Appointments & calendar</strong><p>Manage appointments and journey-specific records.</p></div>
          <Link className="button button-secondary" to="/appointments">Open</Link>
        </div>
        <div className="settings-link">
          <div><strong>Replay the FEMORA guide</strong><p>Review the introduction and personalisation questions.</p></div>
          <button className="button button-secondary" type="button" onClick={() => navigate("/onboarding")}>Replay guide</button>
        </div>
        <div className="settings-link">
          <div><strong>Privacy Policy</strong><p>Read the privacy information.</p></div>
          <Link className="button button-secondary" to="/legal/privacy">Read</Link>
        </div>
        <div className="settings-link">
          <div><strong>Terms of use</strong><p>Read the terms and limitations.</p></div>
          <Link className="button button-secondary" to="/legal/terms">Read</Link>
        </div>
      </section>

      <section className="section-card settings-section">
        <h2>Switch profile</h2>
        <p>Return to the profile picker on this device.</p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => { clearActiveProfile(); navigate("/profiles"); }}
        >
          Switch profile
        </button>
      </section>
    </div>
  );
}
