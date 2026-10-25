import { useState, type FormEvent } from "react";
import PageHeader from "../ui/common/PageHeader";
import EmptyState from "../ui/common/EmptyState";
import { createId, formatDate } from "../lib/utils";
import { useAppContext } from "../app/providers";
import type { Appointment } from "../types";

type JourneyEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
};

function readArray<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export default function AppointmentsPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const journey = activeProfile?.journey ?? "menstrual";

  const appointmentKey = `femora.appointments.${profileId || "none"}`;
  const eventKey = `femora.calendar-events.v1.${profileId || "none"}`;

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    readArray<Appointment>(appointmentKey),
  );

  const [events, setEvents] = useState<JourneyEvent[]>(() =>
    readArray<JourneyEvent>(eventKey),
  );

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [eventDetail, setEventDetail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const journeyCopy = {
    menstrual: {
      eyebrow: "MENSTRUAL HEALTH",
      title: "Cycle & care calendar",
      description:
        "Keep period dates, estimated phases, symptoms and care appointments together.",
      eventHeading: "Add a cycle event",
      eventLabel: "Event",
      eventPlaceholder:
        "e.g. Period started, cramps, estimated phase, clinician question",
      detailLabel: "Notes",
      detailPlaceholder: "Optional notes about your cycle or symptoms",
    },
    maternity: {
      eyebrow: "MATERNITY & POSTPARTUM",
      title: "Maternity care calendar",
      description:
        "Organise antenatal visits, birth preparation, postpartum follow-ups and questions for your care team.",
      eventHeading: "Add a maternity milestone",
      eventLabel: "Milestone",
      eventPlaceholder:
        "e.g. Antenatal visit, birth-plan task, hospital checklist, recovery note",
      detailLabel: "Details",
      detailPlaceholder: "Optional notes or questions for your care team",
    },
    menopause: {
      eyebrow: "PERIMENOPAUSE & MENOPAUSE",
      title: "Wellbeing & care calendar",
      description:
        "Record hot flashes, sleep or mood changes, symptoms, care appointments and questions.",
      eventHeading: "Add a wellbeing entry",
      eventLabel: "Entry",
      eventPlaceholder:
        "e.g. Hot flash, sleep change, mood, symptom, clinician question",
      detailLabel: "Details",
      detailPlaceholder: "Optional notes about symptoms or wellbeing",
    },
  }[journey];

  function persistAppointments(next: Appointment[]) {
    if (!profileId) {
      setError("Select a profile before saving appointments.");
      return false;
    }

    try {
      localStorage.setItem(appointmentKey, JSON.stringify(next));
      setAppointments(next);
      setError("");
      setSuccess("Appointment saved.");
      return true;
    } catch {
      setError("Unable to save the appointment in browser storage.");
      setSuccess("");
      return false;
    }
  }

  function persistEvents(next: JourneyEvent[]) {
    if (!profileId) {
      setError("Select a profile before saving calendar entries.");
      return false;
    }

    try {
      localStorage.setItem(eventKey, JSON.stringify(next));
      setEvents(next);
      setError("");
      setSuccess("Calendar entry saved.");
      return true;
    } catch {
      setError("Unable to save the entry in browser storage.");
      setSuccess("");
      return false;
    }
  }

  function handleAppointmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !date || !time) {
      setError("Enter an appointment title, date and time.");
      return;
    }

    const appointment: Appointment = {
      id: createId(),
      title: title.trim(),
      date,
      time,
      ...(appointmentNotes.trim()
        ? { notes: appointmentNotes.trim() }
        : {}),
    };

    if (persistAppointments([...appointments, appointment])) {
      setTitle("");
      setDate("");
      setTime("");
      setAppointmentNotes("");
    }
  }

  function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!eventTitle.trim() || !eventDate) {
      setError("Enter a calendar entry title and date.");
      return;
    }

    const item: JourneyEvent = {
      id: createId(),
      date: eventDate,
      title: eventTitle.trim(),
      detail: eventDetail.trim(),
    };

    if (persistEvents([...events, item])) {
      setEventTitle("");
      setEventDetail("");
    }
  }

  function removeAppointment(id: string) {
    if (!window.confirm("Delete this appointment?")) return;
    persistAppointments(appointments.filter((item) => item.id !== id));
  }

  function removeEvent(id: string) {
    if (!window.confirm("Delete this calendar entry?")) return;
    persistEvents(events.filter((item) => item.id !== id));
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before managing appointments or health entries.</p>
      </section>
    );
  }

  const sortedAppointments = [...appointments].sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );

  const sortedEvents = [...events].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <main>
      <PageHeader
        eyebrow={journeyCopy.eyebrow}
        title={journeyCopy.title}
        description={journeyCopy.description}
      />

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>{journeyCopy.eventHeading}</h2>
        <form onSubmit={handleEventSubmit}>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="health-event-date">Date</label>
              <input
                id="health-event-date"
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="health-event-title">{journeyCopy.eventLabel}</label>
              <input
                id="health-event-title"
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                maxLength={100}
                placeholder={journeyCopy.eventPlaceholder}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="health-event-detail">{journeyCopy.detailLabel}</label>
            <textarea
              id="health-event-detail"
              rows={3}
              value={eventDetail}
              onChange={(event) => setEventDetail(event.target.value)}
              maxLength={2000}
              placeholder={journeyCopy.detailPlaceholder}
            />
          </div>

          <button className="button button-primary" type="submit">
            Save calendar entry
          </button>
        </form>

        <div style={{ marginTop: 20 }}>
          <h3>Health calendar entries</h3>
          {sortedEvents.length === 0 ? (
            <EmptyState
              icon="▦"
              title="No health entries yet"
              description="Entries you add for this profile will appear here."
            />
          ) : (
            <div className="list-stack">
              {sortedEvents.map((item) => (
                <article className="list-row" key={item.id}>
                  <div className="list-row-content">
                    <strong>{item.title}</strong>
                    <p>
                      {formatDate(item.date)}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </p>
                  </div>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => removeEvent(item.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-card">
        <h2>Add an appointment</h2>
        <form onSubmit={handleAppointmentSubmit}>
          <div className="field">
            <label htmlFor="appointment-title">Appointment title</label>
            <input
              id="appointment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              placeholder="e.g. Care team appointment"
              required
            />
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="appointment-date">Date</label>
              <input
                id="appointment-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="appointment-time">Time</label>
              <input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="appointment-notes">Notes (optional)</label>
            <textarea
              id="appointment-notes"
              rows={3}
              maxLength={2000}
              value={appointmentNotes}
              onChange={(event) => setAppointmentNotes(event.target.value)}
              placeholder="Questions or information you want to remember"
            />
          </div>

          <button className="button button-primary" type="submit">
            Save appointment
          </button>
        </form>

        {error && <p className="error-text" role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <div style={{ marginTop: 24 }}>
          <h2>Your appointments</h2>
          {sortedAppointments.length === 0 ? (
            <EmptyState
              icon="▦"
              title="Nothing scheduled yet"
              description="Appointments you add will appear here."
            />
          ) : (
            <div className="list-stack">
              {sortedAppointments.map((appointment) => (
                <article className="list-row" key={appointment.id}>
                  <div className="list-row-content">
                    <strong>{appointment.title}</strong>
                    <p>
                      {formatDate(appointment.date)} · {appointment.time}
                    </p>
                    {appointment.notes && <p>{appointment.notes}</p>}
                  </div>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => removeAppointment(appointment.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="field-help" style={{ marginTop: 16 }}>
        Appointments and health calendar entries are saved locally in this
        browser for the selected profile. They are not sent as notifications
        or synced to another device.
      </p>
    </main>
  );
}