import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { readLocalJson, writeLocalJson } from "../../lib/utils";

type BirthPlan = {
  preferences: string;
  supportPerson: string;
  painRelief: string;
  birthEnvironment: string;
  feedingDiscussion: string;
  questions: string;
  notes: string;
  updatedAt: string;
};

const emptyPlan: BirthPlan = {
  preferences: "",
  supportPerson: "",
  painRelief: "",
  birthEnvironment: "",
  feedingDiscussion: "",
  questions: "",
  notes: "",
  updatedAt: "",
};

const savedFields: { label: string; key: keyof BirthPlan }[] = [
  { label: "Birth preferences", key: "preferences" },
  { label: "Support person", key: "supportPerson" },
  { label: "Birth environment", key: "birthEnvironment" },
  { label: "Pain relief discussions", key: "painRelief" },
  { label: "Feeding and early-care questions", key: "feedingDiscussion" },
  { label: "Questions for the care team", key: "questions" },
  { label: "Additional notes", key: "notes" },
];

export default function BirthPlanPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.maternity-birth-plan.v1.${profileId}`;

  const [plan, setPlan] = useState<BirthPlan>(emptyPlan);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!profileId) {
      setPlan(emptyPlan);
      setEditing(false);
      return;
    }

    const savedPlan = readLocalJson<BirthPlan>(storageKey, emptyPlan);
    setPlan(savedPlan);
    setEditing(!savedPlan.updatedAt);
    setError("");
    setSuccess("");
  }, [profileId, storageKey]);

  function updateField(field: keyof BirthPlan, value: string) {
    setPlan((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileId) {
      setError("Select a profile before saving your birth plan.");
      return;
    }

    const planToSave: BirthPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };

    if (!writeLocalJson(storageKey, planToSave)) {
      setError("Unable to save your birth plan. Check browser storage and try again.");
      return;
    }

    setPlan(planToSave);
    setEditing(false);
    setSuccess("Your birth plan has been saved successfully on this device.");
  }

  function handleDelete() {
    if (!profileId || !plan.updatedAt) return;

    const confirmed = window.confirm(
      "Delete this saved birth plan? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      localStorage.removeItem(storageKey);
      setPlan(emptyPlan);
      setEditing(true);
      setError("");
      setSuccess("Your saved birth plan has been deleted.");
    } catch {
      setError("Unable to delete the saved plan. Please try again.");
      setSuccess("");
    }
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before creating a birth plan.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  const hasSavedPlan = Boolean(plan.updatedAt);

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY PREPARATION"
        title="Your birth plan"
        description="Save your preferences and questions, view them whenever you return, and update them as needed."
      />

      {success && <p role="status">{success}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}

      {hasSavedPlan && !editing ? (
        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Your saved birth plan</h2>
          <p className="field-help">
            Last saved: {new Date(plan.updatedAt).toLocaleString()}
          </p>

          <div className="list-stack">
            {savedFields.map(({ label, key }) => {
              const value = plan[key];

              if (typeof value !== "string" || !value.trim()) return null;

              return (
                <article className="list-row" key={key}>
                  <div className="list-row-content">
                    <strong>{label}</strong>
                    <p style={{ whiteSpace: "pre-wrap" }}>{value}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {savedFields.every(({ key }) => {
            const value = plan[key];
            return typeof value !== "string" || !value.trim();
          }) && (
            <p>Your birth plan is saved, but it has no details yet.</p>
          )}

          <div className="button-row" style={{ marginTop: 20 }}>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setEditing(true);
                setSuccess("");
              }}
            >
              Edit birth plan
            </button>

            <button
              className="button button-secondary"
              type="button"
              onClick={handleDelete}
            >
              Delete saved plan
            </button>

            <Link className="button button-secondary" to="/maternity/dashboard">
              Back to maternity
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit}>
          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Birth preferences</h2>
            <p>
              Record what matters to you. These are discussion points, not
              guarantees about what will happen during birth.
            </p>

            <div className="field">
              <label htmlFor="birth-preferences">
                Preferences and things that matter to me
              </label>
              <textarea
                id="birth-preferences"
                rows={4}
                maxLength={3000}
                value={plan.preferences}
                onChange={(event) => updateField("preferences", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="birth-support">Support person (optional)</label>
              <input
                id="birth-support"
                type="text"
                maxLength={150}
                value={plan.supportPerson}
                onChange={(event) => updateField("supportPerson", event.target.value)}
                placeholder="Name or relationship"
              />
            </div>

            <div className="field">
              <label htmlFor="birth-environment">
                Birth environment preferences (optional)
              </label>
              <textarea
                id="birth-environment"
                rows={3}
                maxLength={2000}
                value={plan.birthEnvironment}
                onChange={(event) => updateField("birthEnvironment", event.target.value)}
              />
            </div>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Topics to discuss with your care team</h2>

            <div className="field">
              <label htmlFor="birth-pain-relief">Pain relief options (optional)</label>
              <textarea
                id="birth-pain-relief"
                rows={3}
                maxLength={2000}
                value={plan.painRelief}
                onChange={(event) => updateField("painRelief", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="birth-feeding">
                Feeding and early-care questions (optional)
              </label>
              <textarea
                id="birth-feeding"
                rows={3}
                maxLength={2000}
                value={plan.feedingDiscussion}
                onChange={(event) => updateField("feedingDiscussion", event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="birth-questions">
                Questions for my maternity care team
              </label>
              <textarea
                id="birth-questions"
                rows={4}
                maxLength={3000}
                value={plan.questions}
                onChange={(event) => updateField("questions", event.target.value)}
              />
            </div>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Additional notes</h2>
            <div className="field">
              <label htmlFor="birth-notes">Notes (optional)</label>
              <textarea
                id="birth-notes"
                rows={4}
                maxLength={3000}
                value={plan.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </div>
          </section>

          <div className="button-row">
            <button className="button button-primary" type="submit">
              Save birth plan
            </button>

            {hasSavedPlan && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setPlan(readLocalJson<BirthPlan>(storageKey, emptyPlan));
                  setEditing(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Cancel editing
              </button>
            )}

            <Link className="button button-secondary" to="/maternity/dashboard">
              Back to maternity
            </Link>
          </div>
        </form>
      )}

      <p className="field-help" style={{ marginTop: 18 }}>
        This plan helps organise your preferences and questions. It is stored
        in this browser for the selected profile. It is not medical advice and
        does not replace decisions made with your qualified maternity care team.
      </p>
    </main>
  );
}