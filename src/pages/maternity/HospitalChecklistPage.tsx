
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { readLocalJson, writeLocalJson } from "../../lib/utils";

const items = [
  "Documents and appointment details",
  "Comfort items",
  "Clothing and essentials",
  "Questions for the care team",
  "Transport and contact arrangements",
];

export default function HospitalChecklistPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.maternity-hospital-checklist.v1.${profileId}`;

  const [checked, setChecked] = useState<boolean[]>(
    items.map(() => false),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!profileId) {
      setChecked(items.map(() => false));
      return;
    }

    const saved = readLocalJson<boolean[]>(storageKey, []);
    setChecked(
      items.map((_, index) => saved[index] === true),
    );
    setError("");
    setSuccess("");
  }, [profileId, storageKey]);

  function toggle(index: number) {
    const next = checked.map((value, i) =>
      i === index ? !value : value,
    );

    if (!writeLocalJson(storageKey, next)) {
      setError("Unable to save your checklist. Please check browser storage.");
      setSuccess("");
      return;
    }

    setChecked(next);
    setError("");
    setSuccess("Checklist progress saved.");
  }

  function resetChecklist() {
    if (!profileId) return;

    const confirmed = window.confirm(
      "Reset all items in this profile's hospital checklist?",
    );

    if (!confirmed) return;

    const empty = items.map(() => false);

    if (!writeLocalJson(storageKey, empty)) {
      setError("Unable to reset the checklist. Please try again.");
      setSuccess("");
      return;
    }

    setChecked(empty);
    setError("");
    setSuccess("Checklist reset.");
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to save your hospital checklist.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  const completed = checked.filter(Boolean).length;
  const allComplete = completed === items.length;

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY PREPARATION"
        title="Hospital checklist"
        description="Organise the items and questions you want to prepare before a hospital visit. Customise this list with your care team."
      />

      <section className="section-card">
        <h2>Your preparation progress</h2>
        <p>
          {completed} of {items.length} items completed
        </p>

        <div
          role="progressbar"
          aria-label="Hospital checklist progress"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={completed}
          style={{
            height: 10,
            borderRadius: 999,
            background: "var(--border, #dedede)",
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: `${(completed / items.length) * 100}%`,
              height: "100%",
              background: "var(--primary, #b85d69)",
              transition: "width 180ms ease",
            }}
          />
        </div>

        {items.map((item, index) => (
          <label className="check-row" key={item}>
            <input
              type="checkbox"
              checked={checked[index] ?? false}
              onChange={() => toggle(index)}
            />
            <span>{item}</span>
          </label>
        ))}

        {allComplete && (
          <p role="status">
            All checklist items are marked complete!
          </p>
        )}

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        {success && <p role="status">{success}</p>}

        <div className="button-row" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={resetChecklist}
          >
            Reset checklist
          </button>

          <Link
            className="button button-secondary"
            to="/maternity/dashboard"
          >
            Back to maternity
          </Link>
        </div>
      </section>

      <p className="field-help" style={{ marginTop: 16 }}>
        Your checklist is stored locally in this browser for the selected
        profile. It is an organisational aid, not medical advice or a
        substitute for instructions from your maternity care team.
      </p>
    </main>
  );
}
