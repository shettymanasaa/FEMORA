import { useMemo, useState, type FormEvent } from "react";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
};

type CyclePhase = {
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  label: string;
};

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;

function getStorageKey(profileId: string) {
  return `femora.period-records.v1.${profileId}`;
}

function readRecords(profileId: string): PeriodRecord[] {
  try {
    const value = localStorage.getItem(getStorageKey(profileId));
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PeriodRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.startDate === "string",
    );
  } catch {
    return [];
  }
}

function dayDifference(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function estimateCycleLength(records: PeriodRecord[]): number {
  const sorted = [...records].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  const lengths: number[] = [];

  for (let index = 1; index < sorted.length; index += 1) {
    const days = dayDifference(
      sorted[index - 1].startDate,
      sorted[index].startDate,
    );

    if (days >= 15 && days <= 60) lengths.push(days);
  }

  if (!lengths.length) return DEFAULT_CYCLE_LENGTH;

  return Math.round(
    lengths.reduce((total, value) => total + value, 0) / lengths.length,
  );
}

function getPhase(
  cycleDay: number,
  cycleLength: number,
  periodLength: number,
): CyclePhase {
  const safeCycleLength = Math.max(15, Math.min(60, cycleLength));
  const safePeriodLength = Math.max(
    1,
    Math.min(periodLength, safeCycleLength),
  );

  // Calendar-based estimates only. Ovulation timing varies.
  const estimatedOvulationDay = Math.max(
    1,
    safeCycleLength - 14,
  );

  if (cycleDay <= safePeriodLength) {
    return {
      name: "Menstruation",
      description: "Your recorded period window.",
      startDay: 1,
      endDay: safePeriodLength,
      label: "Period",
    };
  }

  if (cycleDay < estimatedOvulationDay - 2) {
    return {
      name: "Follicular phase",
      description:
        "The phase between the start of your period and the estimated ovulation window.",
      startDay: safePeriodLength + 1,
      endDay: Math.max(safePeriodLength + 1, estimatedOvulationDay - 3),
      label: "Follicular",
    };
  }

  if (cycleDay <= estimatedOvulationDay + 2) {
    return {
      name: "Estimated ovulation window",
      description:
        "A calendar estimate only. A period date cannot confirm whether or when ovulation occurred.",
      startDay: Math.max(1, estimatedOvulationDay - 2),
      endDay: Math.min(safeCycleLength, estimatedOvulationDay + 2),
      label: "Estimated ovulation",
    };
  }

  return {
    name: "Luteal phase",
    description:
      "The phase after the estimated ovulation window and before the next period.",
    startDay: estimatedOvulationDay + 3,
    endDay: safeCycleLength,
    label: "Luteal",
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ??
    `period-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CyclePage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [records, setRecords] = useState<PeriodRecord[]>(() =>
    profileId ? readRecords(profileId) : [],
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [records],
  );

  const latestPeriod = sortedRecords[0];
  const cycleLength = useMemo(
    () => estimateCycleLength(records),
    [records],
  );

  const periodLength = latestPeriod?.endDate
    ? Math.max(
        1,
        Math.min(
          15,
          dayDifference(latestPeriod.startDate, latestPeriod.endDate) + 1,
        ),
      )
    : DEFAULT_PERIOD_LENGTH;

  const cycleDay = latestPeriod
    ? dayDifference(latestPeriod.startDate, new Date().toLocaleDateString("en-CA")) + 1
    : 0;

  const currentCycleDay =
    cycleDay >= 1 && cycleDay <= cycleLength ? cycleDay : 0;

  const phase = currentCycleDay
    ? getPhase(currentCycleDay, cycleLength, periodLength)
    : null;

  const estimatedNextPeriod = latestPeriod
    ? (() => {
        const date = new Date(`${latestPeriod.startDate}T00:00:00`);
        date.setDate(date.getDate() + cycleLength);
        return date.toLocaleDateString("en-CA");
      })()
    : "";

  const estimatedOvulation = latestPeriod
    ? (() => {
        const date = new Date(`${latestPeriod.startDate}T00:00:00`);
        date.setDate(date.getDate() + Math.max(1, cycleLength - 14) - 1);
        return date.toLocaleDateString("en-CA");
      })()
    : "";

  function persist(next: PeriodRecord[]) {
    if (!profileId) {
      setError("Select a profile before saving period dates.");
      return false;
    }

    try {
      localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      setRecords(next);
      setError("");
      setSuccess("Your cycle record has been saved.");
      return true;
    } catch {
      setError(
        "Your record could not be saved in this browser. Check available storage and try again.",
      );
      setSuccess("");
      return false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!startDate) {
      setError("Choose the first day of your period.");
      return;
    }

    const today = new Date().toLocaleDateString("en-CA");

    if (startDate > today) {
      setError("The period start date cannot be in the future.");
      return;
    }

    if (endDate && endDate < startDate) {
      setError("The period end date cannot be before the start date.");
      return;
    }

    if (endDate && dayDifference(startDate, endDate) > 14) {
      setError("Please check the end date. It is more than 15 days after the start date.");
      return;
    }

    const duplicate = records.some(
      (record) => record.startDate === startDate,
    );

    if (duplicate) {
      setError("A period record already exists for that start date.");
      return;
    }

    const record: PeriodRecord = {
      id: makeId(),
      startDate,
      ...(endDate ? { endDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: new Date().toISOString(),
    };

    if (persist([...records, record])) {
      coreApi.saveMenstrualCheckIn(profileId, { date: startDate, kind: "period_start", flow: "medium" }).catch(() => {});
      setStartDate("");
      setEndDate("");
      setNotes("");
    }
  }

  function deleteRecord(id: string) {
    if (!window.confirm("Delete this period record?")) return;
    persist(records.filter((record) => record.id !== id));
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Select a profile</h1>
        <p>Choose a profile before recording cycle dates.</p>
      </section>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="MENSTRUAL HEALTH"
        title="Your cycle calendar"
        description="Record period dates and view estimated cycle phases based on your saved history."
      />

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>Record a period</h2>
        <p>
          Add the first day of bleeding and, if known, the last day.
          You can leave the end date blank and update it later by
          adding a new record if needed.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="period-start">Period start date</label>
              <input
                id="period-start"
                type="date"
                value={startDate}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="period-end">Period end date (optional)</label>
              <input
                id="period-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="period-notes">Notes (optional)</label>
            <textarea
              id="period-notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything you would like to remember about this period"
            />
          </div>

          {error && <p className="error-text" role="alert">{error}</p>}
          {success && <p role="status">{success}</p>}

          <button className="button button-primary" type="submit">
            Save period dates
          </button>
        </form>
      </section>

      <section className="grid grid-2" style={{ marginBottom: 20 }}>
        <article className="section-card">
          <p className="eyebrow">CURRENT CYCLE ESTIMATE</p>
          <h2>{phase?.name ?? "Not enough data yet"}</h2>
          {phase ? (
            <>
              <p>Estimated cycle day: {currentCycleDay} of about {cycleLength}</p>
              <p>{phase.description}</p>
            </>
          ) : (
            <p>
              Save a period start date to see the estimated cycle day
              and phase.
            </p>
          )}
        </article>

        <article className="section-card">
          <p className="eyebrow">YOUR CYCLE DETAILS</p>
          <h2>Personal history</h2>
          <p>
            <strong>Average recorded cycle:</strong>{" "}
            {records.length >= 2 ? `${cycleLength} days` : "Not enough records"}
          </p>
          <p>
            <strong>Estimated next period:</strong>{" "}
            {formatDate(estimatedNextPeriod)}
          </p>
          <p>
            <strong>Estimated ovulation date:</strong>{" "}
            {formatDate(estimatedOvulation)}
          </p>
          <p className="field-help">
            Estimates use calendar dates and may be inaccurate, especially
            when cycles are irregular.
          </p>
        </article>
      </section>

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>Understand the phases</h2>
        <div className="grid grid-2">
          <article className="phase-card">
            <span className="phase-dot phase-period" />
            <h3>Menstruation</h3>
            <p>Days when menstrual bleeding occurs.</p>
          </article>
          <article className="phase-card">
            <span className="phase-dot phase-follicular" />
            <h3>Follicular phase</h3>
            <p>Begins on the first day of the period and continues toward ovulation.</p>
          </article>
          <article className="phase-card">
            <span className="phase-dot phase-ovulation" />
            <h3>Estimated ovulation window</h3>
            <p>A calendar estimate only. It cannot confirm that ovulation occurred.</p>
          </article>
          <article className="phase-card">
            <span className="phase-dot phase-luteal" />
            <h3>Luteal phase</h3>
            <p>Follows ovulation and continues until the next period.</p>
          </article>
        </div>
      </section>

      <section className="section-card">
        <h2>Period history</h2>
        {sortedRecords.length === 0 ? (
          <p>No period dates saved yet. Your history will appear here.</p>
        ) : (
          <div className="list-stack">
            {sortedRecords.map((record) => (
              <article className="list-row" key={record.id}>
                <div className="list-row-content">
                  <strong>Period started {formatDate(record.startDate)}</strong>
                  <p>
                    End date: {formatDate(record.endDate)}
                    {record.notes ? ` · ${record.notes}` : ""}
                  </p>
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
    </main>
  );
}