
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { createId, readLocalJson, writeLocalJson } from "../../lib/utils";

type MaternityCheckIn = {
  id: string;
  date: string;
  stage: string;
  symptoms: string[];
  mood?: string;
  energy?: string;
  notes?: string;
  createdAt: string;
};

const symptomOptions = [
  "Nausea",
  "Fatigue",
  "Back discomfort",
  "Sleep difficulties",
  "Swelling",
  "Appetite changes",
  "Mood changes",
  "Other",
];

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MaternityCheckInPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.maternity-checkins.v1.${profileId}`;

  const [date, setDate] = useState(todayLocal);
  const [stage, setStage] = useState("Pregnancy");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refresh, setRefresh] = useState(0);

  const records = profileId
    ? readLocalJson<MaternityCheckIn[]>(storageKey, [])
    : [];

  function toggleSymptom(symptom: string, checked: boolean) {
    setSymptoms((current) =>
      checked
        ? [...current, symptom]
        : current.filter((item) => item !== symptom),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileId) {
      setError("Select a profile before saving a check-in.");
      return;
    }

    if (!date || date > todayLocal()) {
      setError("Choose a valid date that is not in the future.");
      return;
    }

    const entry: MaternityCheckIn = {
      id: createId(),
      date,
      stage,
      symptoms,
      ...(mood ? { mood } : {}),
      ...(energy ? { energy } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: new Date().toISOString(),
    };

    const current = readLocalJson<MaternityCheckIn[]>(storageKey, []);
    const saved = writeLocalJson(storageKey, [entry, ...current]);

    if (!saved) {
      setError(
        "Unable to save this check-in in browser storage. Please try again.",
      );
      return;
    }

    setSuccess("Your check-in has been saved on this device for this profile.");
    setSymptoms([]);
    setMood("");
    setEnergy("");
    setNotes("");
    setRefresh((value) => value + 1);
  }

  function deleteRecord(id: string) {
    if (!profileId) return;

    const confirmed = window.confirm("Delete this check-in?");
    if (!confirmed) return;

    const current = readLocalJson<MaternityCheckIn[]>(storageKey, []);
    const saved = writeLocalJson(
      storageKey,
      current.filter((record) => record.id !== id),
    );

    if (!saved) {
      setError("Unable to delete this record. Please try again.");
      return;
    }

    setError("");
    setSuccess("Check-in deleted.");
    setRefresh((value) => value + 1);
  }

  // Re-read saved records after a successful save or deletion.
  const displayedRecords = refresh >= 0 ? records : [];

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before recording wellbeing details.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY WELLBEING"
        title="Your maternity check-in"
        description="Record how you are feeling and keep notes for conversations with your care team. All fields except the date and stage are optional."
      />

      <form onSubmit={handleSubmit}>
        <section className="section-card" style={{ marginBottom: 20 }}>
          <div className="field">
            <label htmlFor="maternity-date">Check-in date</label>
            <input
              id="maternity-date"
              type="date"
              max={todayLocal()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="maternity-stage">Journey stage</label>
            <select
              id="maternity-stage"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              required
            >
              <option value="Pregnancy">Pregnancy</option>
              <option value="Postpartum">Postpartum</option>
            </select>
          </div>

          <h2>Symptoms and wellbeing</h2>
          <p>Select anything you want to record. Leaving everything unchecked is okay.</p>

          <div className="symptom-grid">
            {symptomOptions.map((symptom) => (
              <label className="symptom-option" key={symptom}>
                <input
                  type="checkbox"
                  checked={symptoms.includes(symptom)}
                  onChange={(event) =>
                    toggleSymptom(symptom, event.target.checked)
                  }
                />
                <span>{symptom}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Mood and energy</h2>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="maternity-mood">Mood (optional)</label>
              <select
                id="maternity-mood"
                value={mood}
                onChange={(event) => setMood(event.target.value)}
              >
                <option value="">Prefer not to record</option>
                <option value="Very low">Very low</option>
                <option value="Low">Low</option>
                <option value="Okay">Okay</option>
                <option value="Good">Good</option>
                <option value="Very good">Very good</option>
                <option value="Anxious or stressed">Anxious or stressed</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="maternity-energy">Energy level (optional)</label>
              <select
                id="maternity-energy"
                value={energy}
                onChange={(event) => setEnergy(event.target.value)}
              >
                <option value="">Prefer not to record</option>
                <option value="Very low">Very low</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="maternity-notes">Personal notes (optional)</label>
            <textarea
              id="maternity-notes"
              rows={4}
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Questions, feelings, or information you would like to remember"
            />
          </div>
        </section>

        {error && <p className="error-text" role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <div className="button-row">
          <button className="button button-primary" type="submit">
            Save check-in
          </button>
          <Link className="button button-secondary" to="/maternity">
            Cancel
          </Link>
        </div>
      </form>

      <section className="section-card" style={{ marginTop: 24 }}>
        <h2>Your saved check-ins</h2>
        <p>{displayedRecords.length} saved {displayedRecords.length === 1 ? "record" : "records"}</p>

        {displayedRecords.length === 0 ? (
          <p>Your saved check-ins will appear here.</p>
        ) : (
          <div className="list-stack">
            {displayedRecords.map((record) => (
              <article className="list-row" key={record.id}>
                <div className="list-row-content">
                  <strong>{record.date} · {record.stage}</strong>
                  <p>Symptoms: {record.symptoms.join(", ") || "None selected"}</p>
                  <p>Mood: {record.mood || "Not recorded"} · Energy: {record.energy || "Not recorded"}</p>
                  {record.notes && <p>Notes: {record.notes}</p>}
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => deleteRecord(record.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="field-help" style={{ marginTop: 18 }}>
        This is a personal wellbeing record, not a diagnosis or emergency
        assessment. It does not replace prenatal or postpartum care. Contact
        your healthcare professional about concerns and seek urgent medical
        care for severe or rapidly worsening symptoms.
      </p>
    </main>
  );
}
