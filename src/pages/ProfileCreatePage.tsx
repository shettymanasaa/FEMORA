import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";
import type { Journey } from "../types";

export default function ProfileCreatePage() {
  const [nickname, setNickname] = useState("");
  const [journey, setJourney] = useState<Journey>("menstrual");
  const [error, setError] = useState("");
  const { createProfile } = useAppContext();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError("Enter a nickname to create your profile socket.");
      return;
    }

    if (cleanNickname.length > 32) {
      setError("Your nickname must be 32 characters or fewer.");
      return;
    }

    const profile = createProfile(cleanNickname, journey);

    if (!profile) {
      setError("The profile could not be created. Please try again.");
      return;
    }

    // Direct entry to journey dashboard: only profile is required!
    navigate(`/${journey}`);
  }

  function handleCreateWithIntake(event: React.MouseEvent) {
    event.preventDefault();
    setError("");

    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
      setError("Enter a nickname first.");
      return;
    }

    const profile = createProfile(cleanNickname, journey);
    if (!profile) {
      setError("The profile could not be created. Please try again.");
      return;
    }

    navigate("/onboarding");
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
          eyebrow="LOCAL-FIRST PROFILE SOCKET"
          title="Create your profile"
          description="Only your profile is required. No password, no email, no cloud account needed."
        />

        <form className="section-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nickname">
              <strong>Profile Nickname</strong>
            </label>
            <input
              id="nickname"
              name="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setError("");
              }}
              maxLength={32}
              autoComplete="off"
              placeholder="e.g. Maya, Sam, or my space"
              required
              autoFocus
            />
            <p className="field-help">
              Use any nickname you like. Your data is stored locally in your browser.
            </p>
          </div>

          <div className="field" style={{ marginTop: 20 }}>
            <label>
              <strong>Choose Your Active Journey</strong>
            </label>
            <p className="field-help" style={{ marginTop: 2, marginBottom: 12 }}>
              You can switch your journey anytime.
            </p>

            <div
              className="grid grid-3"
              style={{ gap: 12 }}
            >
              {/* Option 1: Menstrual */}
              <button
                type="button"
                onClick={() => setJourney("menstrual")}
                style={{
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: journey === "menstrual" ? "2px solid #C77D88" : "1px solid var(--border, #d8dfd5)",
                  background: journey === "menstrual" ? "#fbf5f6" : "var(--surface, #fff)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>🌸</span>
                <strong style={{ display: "block", marginTop: 6, fontSize: "0.95rem" }}>
                  Menstrual Health
                </strong>
                <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.78rem" }}>
                  Cycle tracking, ovulation window, symptoms &amp; cycle insights.
                </small>
              </button>

              {/* Option 2: Maternity */}
              <button
                type="button"
                onClick={() => setJourney("maternity")}
                style={{
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: journey === "maternity" ? "2px solid #8C9B83" : "1px solid var(--border, #d8dfd5)",
                  background: journey === "maternity" ? "#f5f8f4" : "var(--surface, #fff)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>🌿</span>
                <strong style={{ display: "block", marginTop: 6, fontSize: "0.95rem" }}>
                  Maternity Care
                </strong>
                <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.78rem" }}>
                  Pregnancy weeks, trimesters, checklists &amp; birth plan.
                </small>
              </button>

              {/* Option 3: Menopause */}
              <button
                type="button"
                onClick={() => setJourney("menopause")}
                style={{
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: journey === "menopause" ? "2px solid #B69BC8" : "1px solid var(--border, #d8dfd5)",
                  background: journey === "menopause" ? "#faf6fd" : "var(--surface, #fff)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>🪻</span>
                <strong style={{ display: "block", marginTop: 6, fontSize: "0.95rem" }}>
                  Menopause Transition
                </strong>
                <small style={{ color: "var(--color-muted-foreground, #666)", fontSize: "0.78rem" }}>
                  Perimenopause, hot flashes, sleep &amp; hormone care.
                </small>
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </p>
          )}

          <div className="button-row" style={{ marginTop: 24 }}>
            <button
              className="button button-primary"
              type="submit"
              style={{ fontSize: "1rem", padding: "10px 24px" }}
            >
              Plug In &amp; Enter Dashboard →
            </button>

            <button
              className="button button-secondary"
              type="button"
              onClick={handleCreateWithIntake}
            >
              Optional: Complete full medical intake first
            </button>

            <Link className="button button-secondary" to="/profiles">
              Cancel
            </Link>
          </div>
        </form>

        <section className="section-card" style={{ marginTop: 24, background: "var(--surface-soft, #f7faf6)" }}>
          <p className="eyebrow">PRIVACY GUARANTEE</p>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--color-muted-foreground, #555)" }}>
            FEMORA is completely local-first. We do not require passwords, email addresses, phone numbers,
            or third-party trackers. Your health records and cycle logs remain inside this browser’s private storage.
          </p>
        </section>
      </div>
    </main>
  );
}
