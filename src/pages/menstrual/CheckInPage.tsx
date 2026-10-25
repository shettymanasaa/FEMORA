import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

type SavedCheckIn = {
  id: string;
  date: string;
  symptoms: string[];
  mood?: string;
  sleep?: string;
  energy?: string;
  pain?: number;
  notes?: string;
  createdAt: string;
};

const symptomOptions = [
  "Cramps",
  "Headache",
  "Bloating",
  "Breast tenderness",
  "Acne or skin changes",
  "Fatigue",
  "Nausea",
  "Back pain",
  "Spotting",
  "Other",
];

function makeId() {
  return globalThis.crypto?.randomUUID?.() ??
    `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CheckInPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("");
  const [sleep, setSleep] = useState("");
  const [energy, setEnergy] = useState("");
  const [pain, setPain] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleSymptom(value: string, checked: boolean) {
    setSymptoms((current) =>
      checked
        ? [...current, value]
        : current.filter((item) => item !== value),
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

    if (!date) {
      setError("Choose the date for this check-in.");
      return;
    }

    const today = new Date().toLocaleDateString("en-CA");
    if (date > today) {
      setError("A check-in date cannot be in the future.");
      return;
    }

    const key = `femora.menstrual-checkins.v1.${profileId}`;

    try {
      const raw = localStorage.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const current: SavedCheckIn[] = Array.isArray(parsed) ? parsed : [];

      const entry: SavedCheckIn = {
        id: makeId(),
        date,
        symptoms,
        ...(mood ? { mood } : {}),
        ...(sleep ? { sleep } : {}),
        ...(energy ? { energy } : {}),
        pain: Number(pain),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify([entry, ...current]));
      coreApi.saveMenstrualCheckIn(profileId, {
        date,
        kind: symptoms.some(s => s.toLowerCase().includes("period")) ? "period_start" : "daily",
        symptoms: symptoms.map(s => ({
          code: s.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 30),
          severity: Math.max(1, Math.min(10, Number(pain) || 1)),
        })),
      }).catch(() => {});
      setSuccess("Your check-in has been saved to this profile on this device.");
      setSymptoms([]);
      setMood("");
      setSleep("");
      setEnergy("");
      setPain("0");
      setNotes("");
    } catch {
      setError(
        "Unable to save this check-in in browser storage. Check available storage and try again.",
      );
    }
  }

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
        eyebrow="DAILY WELLBEING"
        title="How are you feeling today?"
        description="Record only what you are comfortable saving. All fields except the date are optional."
      />

      <form onSubmit={handleSubmit}>
        <section className="section-card" style={{ marginBottom: 20 }}>
          <div className="field">
            <label htmlFor="checkin-date">Check-in date</label>
            <input
              id="checkin-date"
              type="date"
              max={new Date().toLocaleDateString("en-CA")}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <h2>Symptoms</h2>
          <p>Select any that apply, or leave them all unchecked.</p>

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
          <h2>Mood, sleep and energy</h2>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="checkin-mood">Mood (optional)</label>
              <select
                id="checkin-mood"
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
                <option value="Irritable">Irritable</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="checkin-sleep">Sleep quality (optional)</label>
              <select
                id="checkin-sleep"
                value={sleep}
                onChange={(event) => setSleep(event.target.value)}
              >
                <option value="">Prefer not to record</option>
                <option value="Very poor">Very poor</option>
                <option value="Poor">Poor</option>
                <option value="Okay">Okay</option>
                <option value="Good">Good</option>
                <option value="Very good">Very good</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="checkin-energy">Energy level (optional)</label>
              <select
                id="checkin-energy"
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

            <div className="field">
              <label htmlFor="checkin-pain">Pain level (optional)</label>
              <select
                id="checkin-pain"
                value={pain}
                onChange={(event) => setPain(event.target.value)}
              >
                <option value="0">0 — No pain</option>
                <option value="1">1 — Minimal</option>
                <option value="2">2</option>
                <option value="3">3 — Mild</option>
                <option value="4">4</option>
                <option value="5">5 — Moderate</option>
                <option value="6">6</option>
                <option value="7">7 — Severe</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10 — Very severe</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="checkin-notes">Notes (optional)</label>
            <textarea
              id="checkin-notes"
              rows={4}
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add anything you want to remember for yourself or discuss with your care team"
            />
          </div>
        </section>

        {error && <p className="error-text" role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <div className="button-row">
          <button className="button button-primary" type="submit">
            Save check-in
          </button>
          <Link className="button button-secondary" to="/menstrual">
            Cancel
          </Link>
        </div>
      </form>

      <p className="field-help" style={{ marginTop: 18 }}>
        A check-in is a personal record, not a diagnosis. Seek professional
        advice if symptoms concern you, and urgent local medical help for
        severe or rapidly worsening symptoms.
      </p>
    </main>
  );
}