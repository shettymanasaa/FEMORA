
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { createId, readLocalJson, writeLocalJson } from "../../lib/utils";

type PostpartumRecord = {
  id: string;
  date: string;
  wellbeing: string;
  mood: string;
  notes: string;
  followUpDate: string;
  followUpQuestions: string;
  createdAt: string;
};

const emptyForm = {
  date: new Date().toLocaleDateString("en-CA"),
  wellbeing: "",
  mood: "",
  notes: "",
  followUpDate: "",
  followUpQuestions: "",
};

export default function PostpartumPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.maternity-postpartum.v1.${profileId}`;

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);

  const records = profileId
    ? readLocalJson<PostpartumRecord[]>(storageKey, [])
    : [];

  function updateField(
    field: keyof typeof emptyForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileId) {
      setError("Select a profile before saving a record.");
      return;
    }

    if (!form.date || form.date > new Date().toLocaleDateString("en-CA")) {
      setError("Choose a valid record date that is not in the future.");
      return;
    }

    if (form.followUpDate && form.followUpDate < form.date) {
      setError("The follow-up date cannot be before the record date.");
      return;
    }

    const current = readLocalJson<PostpartumRecord[]>(storageKey, []);

    if (editingId) {
      const updated = current.map((record) =>
        record.id === editingId
          ? { ...record, ...form }
          : record,
      );

      if (!writeLocalJson(storageKey, updated)) {
        setError("Unable to save changes. Please try again.");
        return;
      }
    } else {
      const entry: PostpartumRecord = {
        id: createId(),
        ...form,
        createdAt: new Date().toISOString(),
      };

      if (!writeLocalJson(storageKey, [entry, ...current])) {
        setError("Unable to save this record. Please try again.");
        return;
      }
    }

    resetForm();
    setSuccess(editingId ? "Record updated." : "Postpartum record saved.");
    setRevision((value) => value + 1);
  }

  function editRecord(record: PostpartumRecord) {
    setForm({
      date: record.date,
      wellbeing: record.wellbeing,
      mood: record.mood,
      notes: record.notes,
      followUpDate: record.followUpDate,
      followUpQuestions: record.followUpQuestions,
    });
    setEditingId(record.id);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecord(id: string) {
    if (!window.confirm("Delete this postpartum record?")) return;

    const current = readLocalJson<PostpartumRecord[]>(storageKey, []);
    const updated = current.filter((record) => record.id !== id);

    if (!writeLocalJson(storageKey, updated)) {
      setError("Unable to delete this record. Please try again.");
      return;
    }

    if (editingId === id) resetForm();
    setError("");
    setSuccess("Record deleted.");
    setRevision((value) => value + 1);
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before recording postpartum information.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  // The revision state triggers a fresh read after edits and deletions.
  const displayedRecords = revision >= 0 ? records : [];

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY · POSTPARTUM"
        title="Postpartum recovery"
        description="Keep personal wellbeing notes and organise follow-up questions for your care team."
      />

      <form onSubmit={handleSubmit}>
        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>{editingId ? "Edit record" : "Wellbeing record"}</h2>

          <div className="field">
            <label htmlFor="postpartum-date">Record date</label>
            <input
              id="postpartum-date"
              type="date"
              max={new Date().toLocaleDateString("en-CA")}
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="postpartum-wellbeing">General wellbeing (optional)</label>
            <select
              id="postpartum-wellbeing"
              value={form.wellbeing}
              onChange={(event) => updateField("wellbeing", event.target.value)}
            >
              <option value="">Prefer not to record</option>
              <option value="Doing well">Doing well</option>
              <option value="Managing">Managing</option>
              <option value="Having a difficult day">Having a difficult day</option>
              <option value="Would like support">Would like support</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="postpartum-mood">Mood (optional)</label>
            <select
              id="postpartum-mood"
              value={form.mood}
              onChange={(event) => updateField("mood", event.target.value)}
            >
              <option value="">Prefer not to record</option>
              <option value="Okay">Okay</option>
              <option value="Good">Good</option>
              <option value="Low">Low</option>
              <option value="Anxious or worried">Anxious or worried</option>
              <option value="Overwhelmed">Overwhelmed</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="postpartum-notes">Recovery notes (optional)</label>
            <textarea
              id="postpartum-notes"
              rows={4}
              maxLength={3000}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Personal notes or topics you want to discuss with your care team"
            />
          </div>
        </section>

        <section className="section-card" style={{ marginBottom: 20 }}>
          <h2>Follow-up care</h2>

          <div className="field">
            <label htmlFor="postpartum-followup-date">Follow-up date (optional)</label>
            <input
              id="postpartum-followup-date"
              type="date"
              value={form.followUpDate}
              onChange={(event) =>
                updateField("followUpDate", event.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="postpartum-questions">Questions for the care team (optional)</label>
            <textarea
              id="postpartum-questions"
              rows={3}
              maxLength={3000}
              value={form.followUpQuestions}
              onChange={(event) =>
                updateField("followUpQuestions", event.target.value)
              }
              placeholder="Questions to remember at your follow-up appointment"
            />
          </div>
        </section>

        {error && <p className="error-text" role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <div className="button-row">
          <button className="button button-primary" type="submit">
            {editingId ? "Update record" : "Save record"}
          </button>
          {editingId && (
            <button
              className="button button-secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
          <Link className="button button-secondary" to="/maternity/dashboard">
            Back to maternity
          </Link>
        </div>
      </form>

      <section className="section-card" style={{ marginTop: 24 }}>
        <h2>Saved postpartum records</h2>
        <p>
          {displayedRecords.length} saved{" "}
          {displayedRecords.length === 1 ? "record" : "records"}
        </p>

        {displayedRecords.length === 0 ? (
          <p>Your saved records will appear here.</p>
        ) : (
          <div className="list-stack">
            {displayedRecords.map((record) => (
              <article className="list-row" key={record.id}>
                <div className="list-row-content">
                  <strong>{record.date}</strong>
                  <p>Wellbeing: {record.wellbeing || "Not recorded"}</p>
                  <p>Mood: {record.mood || "Not recorded"}</p>
                  {record.notes && <p>Notes: {record.notes}</p>}
                  {record.followUpDate && (
                    <p>Follow-up date: {record.followUpDate}</p>
                  )}
                  {record.followUpQuestions && (
                    <p>Questions: {record.followUpQuestions}</p>
                  )}
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => editRecord(record)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => deleteRecord(record.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="field-help" style={{ marginTop: 18 }}>
        These entries are personal records, not a diagnosis or medical
        assessment. Follow-up dates are stored as notes; this page does not
        send notifications. Contact your healthcare professional about
        concerns and seek urgent care for severe or rapidly worsening symptoms.
      </p>
    </main>
  );
}
