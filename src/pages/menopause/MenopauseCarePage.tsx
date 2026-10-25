
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { createId, readLocalJson } from "../../lib/utils";

type CareNote = {
  id: string;
  title: string;
  category: string;
  appointmentDate: string;
  followUpDate: string;
  notes: string;
  questions: string;
  completed: boolean;
  createdAt: string;
};

const emptyForm = {
  title: "",
  category: "Questions for my healthcare professional",
  appointmentDate: "",
  followUpDate: "",
  notes: "",
  questions: "",
};

const categories = [
  "Questions for my healthcare professional",
  "Appointment notes",
  "Symptoms to discuss",
  "Medication discussion",
  "Follow-up plan",
  "Other",
];

function formatDate(value: string) {
  if (!value) return "Not set";

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function MenopauseCarePage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const storageKey = `femora.menopause-care-notes.v1.${profileId}`;

  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const records = profileId
    ? readLocalJson<CareNote[]>(storageKey, [])
    : [];

  const sortedRecords = [...records].sort((a, b) => {
    const dateA = a.followUpDate || a.appointmentDate || a.createdAt;
    const dateB = b.followUpDate || b.appointmentDate || b.createdAt;
    return dateA.localeCompare(dateB);
  });

  // Connect refresh state to the displayed saved records.
  const displayedRecords = refresh >= 0 ? sortedRecords : [];

  function updateField(
    field: keyof typeof emptyForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function saveNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!profileId) {
      setError("Choose a profile before saving care notes.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a title for this care note.");
      return;
    }

    try {
      const existing = readLocalJson<CareNote[]>(storageKey, []);
      const now = new Date().toISOString();

      if (editingId) {
        const updated = existing.map((note) =>
          note.id === editingId
            ? {
                ...note,
                ...form,
                title: form.title.trim(),
                notes: form.notes.trim(),
                questions: form.questions.trim(),
              }
            : note,
        );

        localStorage.setItem(storageKey, JSON.stringify(updated));
        setSuccess("Your care note has been updated.");
      } else {
        const newNote: CareNote = {
          id: createId(),
          ...form,
          title: form.title.trim(),
          notes: form.notes.trim(),
          questions: form.questions.trim(),
          completed: false,
          createdAt: now,
        };

        localStorage.setItem(
          storageKey,
          JSON.stringify([newNote, ...existing]),
        );
        setSuccess("Your care note has been saved on this device.");
      }

      setForm(emptyForm);
      setEditingId(null);
      setRefresh((value) => value + 1);
    } catch {
      setError("Unable to save this note. Please try again.");
    }
  }

  function editNote(note: CareNote) {
    setForm({
      title: note.title,
      category: note.category,
      appointmentDate: note.appointmentDate,
      followUpDate: note.followUpDate,
      notes: note.notes,
      questions: note.questions,
    });
    setEditingId(note.id);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function toggleCompleted(noteId: string) {
    try {
      const updated = records.map((note) =>
        note.id === noteId
          ? { ...note, completed: !note.completed }
          : note,
      );

      localStorage.setItem(storageKey, JSON.stringify(updated));
      setRefresh((value) => value + 1);
    } catch {
      setError("Unable to update the follow-up status.");
    }
  }

  function deleteNote(noteId: string) {
    const confirmed = window.confirm(
      "Delete this care note? This cannot be undone.",
    );

    if (!confirmed) return;

    try {
      const updated = records.filter((note) => note.id !== noteId);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      if (editingId === noteId) cancelEdit();

      setRefresh((value) => value + 1);
      setSuccess("Care note deleted.");
      setError("");
    } catch {
      setError("Unable to delete this note. Please try again.");
    }
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to manage your care notes.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  const pendingCount = records.filter((note) => !note.completed).length;

  return (
    <main>
      <PageHeader
        eyebrow="PERIMENOPAUSE & MENOPAUSE"
        title="Your ongoing care"
        description="Keep appointment details, questions and follow-up plans together so you can prepare for conversations with your healthcare professional."
        action={
          <Link className="button" to="/menopause">
            Back to dashboard
          </Link>
        }
      />

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        <article className="section-card">
          <p className="eyebrow">SAVED CARE NOTES</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {records.length}
          </h2>
          <p>Notes saved for this profile on this device.</p>
        </article>

        <article className="section-card">
          <p className="eyebrow">FOLLOW-UPS TO REVIEW</p>
          <h2 style={{ fontSize: 32, margin: "8px 0" }}>
            {pendingCount}
          </h2>
          <p>Items you have not marked as completed.</p>
        </article>
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>{editingId ? "Edit care note" : "Add a care note"}</h2>
        <p>
          Record what matters to you. Only include information you are
          comfortable saving on this device.
        </p>

        <form onSubmit={saveNote}>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div>
              <label htmlFor="care-title">Title *</label>
              <input
                id="care-title"
                className="field-input"
                value={form.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                placeholder="e.g. Questions for next appointment"
                required
              />
            </div>

            <div>
              <label htmlFor="care-category">Category</label>
              <select
                id="care-category"
                className="field-input"
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="care-appointment">
                Appointment date
              </label>
              <input
                id="care-appointment"
                className="field-input"
                type="date"
                value={form.appointmentDate}
                onChange={(event) =>
                  updateField("appointmentDate", event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="care-followup">Follow-up date</label>
              <input
                id="care-followup"
                className="field-input"
                type="date"
                value={form.followUpDate}
                onChange={(event) =>
                  updateField("followUpDate", event.target.value)
                }
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label htmlFor="care-questions">
              Questions to ask
            </label>
            <textarea
              id="care-questions"
              className="field-input"
              rows={3}
              value={form.questions}
              onChange={(event) =>
                updateField("questions", event.target.value)
              }
              placeholder="What would you like to discuss?"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label htmlFor="care-notes">Notes and discussion points</label>
            <textarea
              id="care-notes"
              className="field-input"
              rows={4}
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Add appointment notes, symptoms you want to mention, or follow-up information..."
            />
          </div>

          {error && (
            <p role="alert" style={{ color: "var(--danger, #b42318)" }}>
              {error}
            </p>
          )}

          {success && (
            <p role="status" style={{ color: "var(--success, #287447)" }}>
              {success}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <button type="submit" className="button button-primary">
              {editingId ? "Update care note" : "Save care note"}
            </button>

            {editingId && (
              <button
                type="button"
                className="button"
                onClick={cancelEdit}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="section-card">
        <h2>Your saved care notes</h2>
        <p>Review, update or remove notes whenever you need to.</p>

        {displayedRecords.length === 0 ? (
          <div style={{ padding: "20px 0" }}>
            <p>You have no saved care notes yet.</p>
            <p>Use the form above to record your first question or plan.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            {displayedRecords.map((note) => (
              <article
                key={note.id}
                style={{
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: 12,
                  padding: 16,
                  opacity: note.completed ? 0.75 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p className="eyebrow">{note.category}</p>
                    <h3 style={{ margin: "6px 0" }}>{note.title}</h3>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={note.completed}
                      onChange={() => toggleCompleted(note.id)}
                    />
                    Reviewed
                  </label>
                </div>

                {note.appointmentDate && (
                  <p>
                    <strong>Appointment:</strong>{" "}
                    {formatDate(note.appointmentDate)}
                  </p>
                )}

                {note.followUpDate && (
                  <p>
                    <strong>Follow-up:</strong>{" "}
                    {formatDate(note.followUpDate)}
                  </p>
                )}

                {note.questions && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Questions:</strong>{" "}
                    {note.questions}
                  </p>
                )}

                {note.notes && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Notes:</strong> {note.notes}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    className="button"
                    onClick={() => editNote(note)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="field-help" style={{ marginTop: 16 }}>
        Care notes are stored in this browser on this device for the
        selected profile. They are for organisation and discussion with
        your healthcare professional, not a medical diagnosis or treatment
        recommendation.
      </p>
    </main>
  );
}
