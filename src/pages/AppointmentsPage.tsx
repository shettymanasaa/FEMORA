import { useEffect, useMemo, useState, type FormEvent } from "react";
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

type IntakeCycleInfo = {
  periodStatus?: string;
  periodDate?: string;
  usualCycleLength?: string;
};

type CalendarItem = {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: "appointment" | "event" | "estimate";
};


function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isValidDateKey(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

function readIntakeCycleInfo(profileId: string): IntakeCycleInfo | null {
  try {
    const raw = localStorage.getItem(`femora.intake.v1.${profileId}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as IntakeCycleInfo;
  } catch {
    return null;
  }
}

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
  const [intakeCycleInfo, setIntakeCycleInfo] = useState<IntakeCycleInfo | null>(() =>
    profileId ? readIntakeCycleInfo(profileId) : null,
  );
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  // Reload the correct records when the user switches profiles.
  useEffect(() => {
    setAppointments(readArray<Appointment>(appointmentKey));
    setEvents(readArray<JourneyEvent>(eventKey));
    setIntakeCycleInfo(profileId ? readIntakeCycleInfo(profileId) : null);
  }, [appointmentKey, eventKey, profileId]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(
    toDateKey(new Date()),
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

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const calendarItems = useMemo(() => {
    const items: CalendarItem[] = [
      ...appointments.map((item) => ({
        id: `appointment-${item.id}`,
        date: item.date,
        title: item.title,
        detail: item.time ? `Appointment · ${item.time}${item.notes ? ` · ${item.notes}` : ""}` : "Appointment",
        kind: "appointment" as const,
      })),
      ...events.map((item) => ({
        id: `event-${item.id}`,
        date: item.date,
        title: item.title,
        detail: item.detail || journeyCopy.eventLabel,
        kind: "event" as const,
      })),
    ];

    // Cycle estimates are displayed as derived calendar hints, never saved as
    // confirmed health entries. The source is the profile's onboarding answer.
    if (journey === "menstrual" && intakeCycleInfo?.periodStatus === "yes" &&
        isValidDateKey(intakeCycleInfo.periodDate)) {
      const start = intakeCycleInfo.periodDate;
      const cycleLengthValue = Number(intakeCycleInfo.usualCycleLength);
      const cycleLength = Number.isInteger(cycleLengthValue) && cycleLengthValue >= 21 && cycleLengthValue <= 45
        ? cycleLengthValue
        : 28;
      const startDate = new Date(`${start}T00:00:00`);
      const nextPeriodDate = new Date(startDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
      const ovulationDate = new Date(startDate);
      ovulationDate.setDate(ovulationDate.getDate() + Math.max(1, cycleLength - 14) - 1);
      const nextPeriodKey = toDateKey(nextPeriodDate);
      const ovulationKey = toDateKey(ovulationDate);

      items.push({
        id: `estimate-period-start-${start}`,
        date: start,
        title: "Last period start (from profile)",
        detail: "Profile-reported date; not a separately saved period record.",
        kind: "estimate" as const,
      });
      items.push({
        id: `estimate-next-period-${nextPeriodKey}`,
        date: nextPeriodKey,
        title: "Estimated next period",
        detail: `Calendar estimate based on a ${cycleLength}-day usual cycle. This is not a confirmed date.`,
        kind: "estimate" as const,
      });
      items.push({
        id: `estimate-ovulation-${ovulationKey}`,
        date: ovulationKey,
        title: "Estimated ovulation",
        detail: "Calendar estimate only; this date cannot confirm ovulation.",
        kind: "estimate" as const,
      });
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [appointments, events, journeyCopy.eventLabel, journey, intakeCycleInfo]);

  const selectedDayItems = calendarItems.filter((item) => item.date === selectedDate);

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

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

      <section className="section-card" style={{ marginBottom: 20 }} aria-label="Monthly calendar">
        <div className="button-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <button className="button button-secondary" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹ Previous</button>
          <h2 style={{ margin: 0, textAlign: "center" }}>{monthLabel(visibleMonth)}</h2>
          <button className="button button-secondary" type="button" onClick={() => changeMonth(1)} aria-label="Next month">Next ›</button>
        </div>
        <div className="femora-calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, marginTop: 18 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted, #666)", padding: "6px 0" }}>{day}</div>
          ))}
          {calendarDays.map((day) => {
            const key = toDateKey(day);
            const hasAppointment = calendarItems.some((item) => item.date === key && item.kind === "appointment");
            const hasEvent = calendarItems.some((item) => item.date === key && item.kind !== "appointment");
            const inMonth = day.getMonth() === visibleMonth.getMonth();
            const selected = selectedDate === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                aria-pressed={selected}
                aria-label={`${day.toLocaleDateString(undefined, { dateStyle: "full" })}${hasAppointment ? ", has appointment" : ""}${hasEvent ? ", has health entry" : ""}`}
                style={{
                  minHeight: 58,
                  padding: "7px 3px",
                  border: selected ? "2px solid var(--accent, #6b8066)" : "1px solid var(--border, #ddd)",
                  borderRadius: 10,
                  background: selected ? "var(--surface-soft, #eef3eb)" : "var(--surface, transparent)",
                  color: inMonth ? "var(--text, inherit)" : "var(--text-muted, #999)",
                  opacity: inMonth ? 1 : 0.65,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <span>{day.getDate()}</span>
                <span aria-hidden="true" style={{ display: "flex", gap: 3, minHeight: 6 }}>
                  {hasAppointment && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent, #6b8066)" }} />}
                  {hasEvent && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text, #777)" }} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="button-row" style={{ marginTop: 12, gap: 14, flexWrap: "wrap" }}>
          <span className="field-help">● Appointments</span>
          <span className="field-help">● Health entries & cycle estimates</span>
          <button className="button button-secondary" type="button" onClick={() => { const today = new Date(); setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(toDateKey(today)); }}>Today</button>
        </div>
        <div style={{ marginTop: 20 }}>
          <h3>{formatDate(selectedDate)}</h3>
          {selectedDayItems.length === 0 ? (
            <p className="field-help">Nothing saved for this date yet. Use the forms below to add an appointment or health entry.</p>
          ) : (
            <div className="list-stack">
              {selectedDayItems.map((item) => (
                <article className="list-row" key={item.id}>
                  <div className="list-row-content">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <span className="field-help">{item.kind === "appointment" ? "Appointment" : item.kind === "estimate" ? "Estimate" : "Health entry"}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

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