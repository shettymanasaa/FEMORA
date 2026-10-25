
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../ui/common/PageHeader";
import { useAppContext } from "../app/providers";

type IntakeAnswers = {
  dateOfBirth: string;
  periodStatus: string;
  periodDate: string;
  usualCycleLength: string;
  foodPreference: string;
  acne: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  maritalStatus: string;
  allergies: string;
  healthConditions: string;
  sexualActivity: string;
  workStrain: string;
  sleepQuality: string;
  hotFlashes: string;
  mood: string;
  completedAt?: string;
  ageEligibility?: string;
};

const emptyAnswers: IntakeAnswers = {
  dateOfBirth: "",
  periodStatus: "",
  periodDate: "",
  usualCycleLength: "28",
  foodPreference: "",
  acne: "",
  height: "",
  heightUnit: "cm",
  weight: "",
  weightUnit: "kg",
  maritalStatus: "",
  allergies: "",
  healthConditions: "",
  sexualActivity: "",
  workStrain: "",
  sleepQuality: "",
  hotFlashes: "",
  mood: "",
};

function todayString() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

export default function SettingsPage() {
  const { theme, setTheme, clearActiveProfile, activeProfile } =
    useAppContext();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<IntakeAnswers>(emptyAnswers);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!activeProfile) {
      setAnswers(emptyAnswers);
      setEditingProfile(false);
      return;
    }

    let savedAnswers: IntakeAnswers = { ...emptyAnswers };

    try {
      const raw = localStorage.getItem(
        `femora.intake.v1.${activeProfile.id}`,
      );

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<IntakeAnswers>;
        savedAnswers = { ...emptyAnswers, ...parsed };
      }
    } catch {
      // Continue with the separate DOB value if intake data cannot be read.
    }

    let savedDob = "";

    try {
      savedDob =
        localStorage.getItem(`femora.profile-dob.${activeProfile.id}`) ?? "";
    } catch {
      savedDob = "";
    }

    const resolvedDob = savedAnswers.dateOfBirth || savedDob;

    setAnswers({ ...savedAnswers, dateOfBirth: resolvedDob });
    setProfileMessage("");
    setEditingProfile(false);
  }, [activeProfile?.id]);

  function updateAnswer<K extends keyof IntakeAnswers>(
    key: K,
    value: IntakeAnswers[K],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setProfileMessage("");
  }

  function saveHealthProfile() {
    if (!activeProfile) return;

    if (!answers.dateOfBirth || answers.dateOfBirth > todayString()) {
      setProfileMessage(
        "Enter a valid date of birth that is not in the future.",
      );
      return;
    }

    if (
      answers.periodStatus === "yes" &&
      !answers.periodDate
    ) {
      setProfileMessage("Enter the first day of your last period.");
      return;
    }

    if (answers.periodDate && answers.periodDate > todayString()) {
      setProfileMessage("The last period date cannot be in the future.");
      return;
    }

    if (answers.periodStatus === "yes") {
      const cycleLength = Number(answers.usualCycleLength);

      if (
        !Number.isInteger(cycleLength) ||
        cycleLength < 21 ||
        cycleLength > 45
      ) {
        setProfileMessage("Usual cycle length must be between 21 and 45 days.");
        return;
      }
    }

    try {
      const key = `femora.intake.v1.${activeProfile.id}`;
      const previousRaw = localStorage.getItem(key);
      let previous: Record<string, unknown> = {};

      if (previousRaw) {
        try {
          previous = JSON.parse(previousRaw) as Record<string, unknown>;
        } catch {
          previous = {};
        }
      }

      const payload = {
        ...previous,
        ...answers,
        completedAt:
          answers.completedAt ??
          (previous.completedAt as string | undefined) ??
          new Date().toISOString(),
        ageEligibility:
          answers.ageEligibility ??
          (previous.ageEligibility as string | undefined) ??
          "calculated-from-date-of-birth",
      };

      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem(
        `femora.profile-dob.${activeProfile.id}`,
        answers.dateOfBirth,
      );

      setProfileMessage("Your personal health profile has been saved.");
      setEditingProfile(false);
    } catch {
      setProfileMessage(
        "Your profile could not be saved. Check available browser storage.",
      );
    }
  }

  const selectField = (
    id: keyof IntakeAnswers,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="field">
      <label htmlFor={`profile-${id}`}>{label}</label>
      <select
        id={`profile-${id}`}
        value={String(answers[id] ?? "")}
        onChange={(event) =>
          updateAnswer(id, event.target.value as never)
        }
      >
        <option value="">Choose an option</option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="settings-page">
      <PageHeader
        eyebrow="YOUR SPACE"
        title="Profile & settings"
        description="Manage your personal health profile, appearance and privacy information."
      />

      <section className="section-card">
        <div className="section-card-heading">
          <h2>Current profile</h2>
          <p>Your active local profile.</p>
        </div>

        <div className="settings-link">
          <div className="settings-profile-summary">
            <span
              className="avatar"
              style={{
                backgroundColor: activeProfile?.avatarColor ?? "#b34a5b",
              }}
              aria-hidden="true"
            >
              {activeProfile?.nickname.charAt(0).toUpperCase() ?? "F"}
            </span>

            <div>
              <strong>{activeProfile?.nickname ?? "No active profile"}</strong>
              <p>
                {activeProfile?.journey
                  ? `Journey: ${activeProfile.journey}`
                  : "No journey selected"}
              </p>
            </div>
          </div>

          <Link className="button button-secondary" to="/profiles">
            Manage profiles
          </Link>
        </div>

        <div className="settings-link" style={{ marginTop: 18 }}>
          <div>
            <strong>Personal health profile</strong>
            <p>
              Edit the answers saved during onboarding, including allergies,
              health conditions and wellbeing preferences.
            </p>
          </div>

          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              setEditingProfile((current) => !current);
              setProfileMessage("");
            }}
            disabled={!activeProfile}
          >
            {editingProfile ? "Close editor" : "Edit answers"}
          </button>
        </div>

        {editingProfile && (
          <div className="section-card" style={{ marginTop: 20 }}>
            <h2>Edit personal health profile</h2>
            <p className="field-help">
              Changes are saved to this profile on this device. Optional
              questions can be left blank. Your existing saved answers will
              be preserved unless you change them here.
            </p>

            <h3>Personal details</h3>

            <div className="field">
              <label htmlFor="profile-dateOfBirth">Date of birth</label>
              <input
                id="profile-dateOfBirth"
                type="date"
                max={todayString()}
                value={answers.dateOfBirth}
                onChange={(event) =>
                  updateAnswer("dateOfBirth", event.target.value)
                }
                required
              />
            </div>

            {selectField("foodPreference", "Food preference", [
              { value: "vegetarian", label: "Vegetarian" },
              { value: "non-vegetarian", label: "Non-vegetarian" },
              { value: "vegan", label: "Vegan" },
              { value: "other", label: "Other" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            <div className="form-grid-two">
              <div className="field">
                <label htmlFor="profile-height">Height (optional)</label>
                <div className="input-with-unit">
                  <input
                    id="profile-height"
                    type="number"
                    min="0"
                    max="300"
                    step="any"
                    value={answers.height}
                    onChange={(event) =>
                      updateAnswer("height", event.target.value)
                    }
                    placeholder="Height"
                  />
                  <select
                    aria-label="Height unit"
                    value={answers.heightUnit}
                    onChange={(event) =>
                      updateAnswer("heightUnit", event.target.value)
                    }
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-weight">Weight (optional)</label>
                <div className="input-with-unit">
                  <input
                    id="profile-weight"
                    type="number"
                    min="0"
                    max="500"
                    step="any"
                    value={answers.weight}
                    onChange={(event) =>
                      updateAnswer("weight", event.target.value)
                    }
                    placeholder="Weight"
                  />
                  <select
                    aria-label="Weight unit"
                    value={answers.weightUnit}
                    onChange={(event) =>
                      updateAnswer("weightUnit", event.target.value)
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
            </div>

            {selectField("maritalStatus", "Marital status (optional)", [
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "partnered", label: "Partnered" },
              { value: "other", label: "Other" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            <h3 style={{ marginTop: 24 }}>Health information</h3>

            <div className="field">
              <label htmlFor="profile-allergies">Allergies (optional)</label>
              <textarea
                id="profile-allergies"
                rows={3}
                value={answers.allergies}
                onChange={(event) =>
                  updateAnswer("allergies", event.target.value)
                }
                placeholder="Add allergies you want to record"
              />
            </div>

            <div className="field">
              <label htmlFor="profile-healthConditions">
                Existing health conditions or notes (optional)
              </label>
              <textarea
                id="profile-healthConditions"
                rows={4}
                value={answers.healthConditions}
                onChange={(event) =>
                  updateAnswer("healthConditions", event.target.value)
                }
                placeholder="Add any information you want to keep"
              />
            </div>

            <h3 style={{ marginTop: 24 }}>Menstrual information</h3>

            {selectField("periodStatus", "Have you had a menstrual period?", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "not-applicable", label: "Not applicable" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            {answers.periodStatus === "yes" && (
              <>
                <div className="field">
                  <label htmlFor="profile-periodDate">
                    First day of your last period
                  </label>
                  <input
                    id="profile-periodDate"
                    type="date"
                    max={todayString()}
                    value={answers.periodDate}
                    onChange={(event) =>
                      updateAnswer("periodDate", event.target.value)
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-usualCycleLength">
                    Usual cycle length (days)
                  </label>
                  <input
                    id="profile-usualCycleLength"
                    type="number"
                    min="21"
                    max="45"
                    step="1"
                    value={answers.usualCycleLength}
                    onChange={(event) =>
                      updateAnswer("usualCycleLength", event.target.value)
                    }
                  />
                </div>
              </>
            )}

            <h3 style={{ marginTop: 24 }}>Lifestyle & wellbeing</h3>

            {selectField("acne", "Have you noticed acne recently?", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "sometimes", label: "Sometimes" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            {selectField("workStrain", "Daily routine demands", [
              { value: "low", label: "Less demanding" },
              { value: "moderate", label: "Moderately demanding" },
              { value: "high", label: "Very demanding" },
              { value: "variable", label: "It varies" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            {selectField("sleepQuality", "Sleep quality", [
              { value: "good", label: "Good — mostly restful" },
              {
                value: "mixed",
                label: "Mixed — some good, some difficult nights",
              },
              { value: "poor", label: "Poor — often difficult" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            {selectField("hotFlashes", "Hot flashes or night sweats", [
              { value: "never", label: "Never" },
              { value: "sometimes", label: "Sometimes" },
              { value: "often", label: "Often" },
              { value: "unsure", label: "Not sure" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            {selectField("mood", "Recent mood", [
              { value: "good", label: "Mostly good" },
              { value: "okay", label: "Up and down" },
              { value: "low", label: "Low" },
              { value: "anxious", label: "Anxious or stressed" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            <h3 style={{ marginTop: 24 }}>Sexual wellbeing</h3>
            <p className="field-help">
              This answer is optional. It is stored separately in your profile
              data and should only be included in a report when selected.
            </p>

            {selectField("sexualActivity", "Sexual activity (optional)", [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "prefer-not", label: "Prefer not to say" },
            ])}

            <div className="button-row" style={{ marginTop: 22 }}>
              <button
                className="button button-primary"
                type="button"
                onClick={saveHealthProfile}
              >
                Save changes
              </button>

              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditingProfile(false);
                  setProfileMessage("");
                  if (activeProfile) {
                    const raw = localStorage.getItem(
                      `femora.intake.v1.${activeProfile.id}`,
                    );
                    const parsed = raw
                      ? (JSON.parse(raw) as Partial<IntakeAnswers>)
                      : {};
                    const savedDob =
                      parsed.dateOfBirth ??
                      localStorage.getItem(
                        `femora.profile-dob.${activeProfile.id}`,
                      ) ??
                      "";
                    setAnswers({ ...emptyAnswers, ...parsed, dateOfBirth: savedDob });
                  }
                }}
              >
                Cancel
              </button>
            </div>

            {profileMessage && (
              <p role="status" className="field-help">
                {profileMessage}
              </p>
            )}
          </div>
        )}

      </section>

      <section className="section-card settings-section">
        <div className="section-card-heading">
          <h2>Appearance</h2>
          <p>Choose the theme that feels comfortable to use.</p>
        </div>

        <div className="field">
          <label htmlFor="theme-setting">Colour theme</label>
          <select
            id="theme-setting"
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value as "light" | "dark" | "system")
            }
          >
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
          <div>
            <strong>Privacy controls</strong>
            <p>Review local data and available privacy options.</p>
          </div>
          <Link className="button button-secondary" to="/settings/privacy">
            Open
          </Link>
        </div>

        <div className="settings-link">
          <div>
            <strong>Health history</strong>
            <p>Review records and customize your PDF report.</p>
          </div>
          <Link
            className="button button-secondary"
            to="/profile/health-history"
          >
            View
          </Link>
        </div>

        <div className="settings-link">
          <div>
            <strong>Appointments & calendar</strong>
            <p>Manage appointments and journey-specific records.</p>
          </div>
          <Link className="button button-secondary" to="/appointments">
            Open
          </Link>
        </div>

        <div className="settings-link">
          <div>
            <strong>Replay the FEMORA guide</strong>
            <p>Review the introduction and personalisation questions.</p>
          </div>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => navigate("/onboarding")}
          >
            Replay guide
          </button>
        </div>

        <div className="settings-link">
          <div>
            <strong>Privacy Policy</strong>
            <p>Read the privacy information.</p>
          </div>
          <Link className="button button-secondary" to="/legal/privacy">
            Read
          </Link>
        </div>

        <div className="settings-link">
          <div>
            <strong>Terms of use</strong>
            <p>Read the terms and limitations.</p>
          </div>
          <Link className="button button-secondary" to="/legal/terms">
            Read
          </Link>
        </div>
      </section>

      <section className="section-card settings-section">
        <h2>Switch profile</h2>
        <p>Return to the profile picker on this device.</p>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            clearActiveProfile();
            navigate("/profiles");
          }}
        >
          Switch profile
        </button>
      </section>
    </div>
  );
}
