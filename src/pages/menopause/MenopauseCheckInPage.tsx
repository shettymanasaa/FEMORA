
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { createId, readLocalJson, writeLocalJson } from "../../lib/utils";

type MenopauseCheckIn = {
  id: string;
  date: string;
  stage: string;
  symptoms: string[];
  severity: string;
  mood: string;
  sleep: string;
  energy: string;
  notes: string;
  createdAt: string;
};

const symptomOptions = [
  "Hot flashes",
  "Night sweats",
  "Sleep difficulties",
  "Mood changes",
  "Anxiety or stress",
  "Low mood",
  "Difficulty concentrating or brain fog",
  "Fatigue",
  "Joint or muscle discomfort",
  "Headaches",
  "Changes in menstrual periods",
  "Vaginal or urinary changes",
  "Other",
];

function todayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MenopauseCheckInPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.menopause-checkins.v1.${profileId}`;

  const [date, setDate] = useState(todayLocal);
  const [stage, setStage] = useState("Perimenopause");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("Mild");
  const [mood, setMood] = useState("");
  const [sleep, setSleep] = useState("");
  const [energy, setEnergy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);

  const records = profileId
    ? readLocalJson<MenopauseCheckIn[]>(storageKey, [])
    : [];

  function toggleSymptom(symptom: string, checked: boolean) {
    setSymptoms((current) =>
      checked
        ? [...current, symptom]
        : current.filter((item) => item !== symptom),
    );
  }

  function resetForm() {
    setDate(todayLocal());
    setStage("Perimenopause");
    setSymptoms([]);
    setSeverity("Mild");
    setMood("");
    setSleep("");
    setEnergy("");
    setNotes("");
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

    const entry: MenopauseCheckIn = {
      id: createId(),
      date,
      stage,
      symptoms,
      severity: symptoms.length > 0 ? severity : "",
      mood,
      sleep,
      energy,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const current = readLocalJson<MenopauseCheckIn[]>(storageKey, []);

    if (!writeLocalJson(storageKey, [entry, ...current])) {
      setError(
        "Unable to save your check-in. Please check browser storage and try again.",
      );
      return;
    }

    resetForm();
    setSuccess("Your menopause check-in has been saved on this device.");
    setRevision((value) => value + 1);
  }

  function deleteRecord(id: string) {
    if (!profileId) return;

    if (!window.confirm("Delete this check-in? This cannot be undone.")) {
      return;
    }

    const current = readLocalJson<MenopauseCheckIn[]>(storageKey, []);
    const updated = current.filter((record) => record.id !== id);

    if (!writeLocalJson(storageKey, updated)) {
      setError("Unable to delete this record. Please try again.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("Check-in deleted.");
    setRevision((value) => value + 1);
  }

  // revision triggers a fresh read after saving or deleting records.
  const displayedRecords = revision >= 0 ? records : [];

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before recording your wellbeing.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="MENOPAUSE WELLBEING"
        title="Your daily check-in"
        description="Record symptoms and wellbeing at your own pace. All fields except the date and stage are optional."
      />

      <form onSubmit={handleSubmit}>
        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Check-in details</h2>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="menopause-date">Check-in date</label>
              <input
                id="menopause-date"
                type="date"
                max={todayLocal()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="menopause-stage">Stage</label>
              <select
                id="menopause-stage"
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                required
              >
                <option value="Perimenopause">Perimenopause</option>
                <option value="Menopause">Menopause</option>
                <option value="Postmenopause">Postmenopause</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </div>
        </section>

        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Symptoms</h2>
          <p>Select anything you experienced. You can leave everything unchecked.</p>

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

          <div className="field" style={{ marginTop: 20 }}>
            <label htmlFor="menopause-severity">
              Overall symptom severity (optional)
            </label>
            <select
              id="menopause-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
            <p className="field-help">
              This is your personal rating, not a medical assessment.
            </p>
          </div>
        </section>

        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Mood, sleep and energy</h2>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="menopause-mood">Mood (optional)</label>
              <select
                id="menopause-mood"
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
              <label htmlFor="menopause-sleep">Sleep (optional)</label>
              <select
                id="menopause-sleep"
                value={sleep}
                onChange={(event) => setSleep(event.target.value)}
              >
                <option value="">Prefer not to record</option>
                <option value="Poor">Poor</option>
                <option value="Fair">Fair</option>
                <option value="Good">Good</option>
                <option value="Very good">Very good</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="menopause-energy">Energy level (optional)</label>
              <select
                id="menopause-energy"
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
            <label htmlFor="menopause-notes">Personal notes (optional)</label>
            <textarea
              id="menopause-notes"
              rows={4}
              maxLength={3000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything you noticed, questions, or topics to discuss with your healthcare professional"
            />
          </div>
        </section>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        {success && <p role="status">{success}</p>}

        <div className="button-row">
          <button className="button button-primary" type="submit">
            Save check-in
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={resetForm}
          >
            Clear form
          </button>
          <Link className="button button-secondary" to="/menopause">
            Back to menopause
          </Link>
        </div>
      </form>

      <section className="section-card" style={{ marginTop: 24 }}>
        <h2>Your saved check-ins</h2>
        <p>
          {displayedRecords.length} saved{" "}
          {displayedRecords.length === 1 ? "record" : "records"}
        </p>

        {displayedRecords.length === 0 ? (
          <p>Your saved check-ins will appear here after you save one.</p>
        ) : (
          <div className="list-stack">
            {[...displayedRecords]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((record) => (
                <article className="list-row" key={record.id}>
                  <div className="list-row-content">
                    <strong>
                      {record.date} · {record.stage}
                    </strong>
                    <p>
                      <strong>Symptoms:</strong>{" "}
                      {record.symptoms.join(", ") || "None selected"}
                    </p>
                    {record.severity && (
                      <p>
                        <strong>Severity:</strong> {record.severity}
                      </p>
                    )}
                    <p>
                      <strong>Mood:</strong> {record.mood || "Not recorded"}
                    </p>
                    <p>
                      <strong>Sleep:</strong> {record.sleep || "Not recorded"}
                    </p>
                    <p>
                      <strong>Energy:</strong> {record.energy || "Not recorded"}
                    </p>
                    {record.notes && (
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        <strong>Notes:</strong> {record.notes}
                      </p>
                    )}
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
        Your entries are stored in this browser for the selected profile.
        This check-in is for personal tracking, not diagnosis or emergency
        assessment. Discuss persistent or concerning symptoms with a qualified
        healthcare professional.
      </p>
    </main>
  );
}
