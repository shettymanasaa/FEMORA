
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { readLocalJson } from "../../lib/utils";

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

function formatDate(value?: string) {
  if (!value) return "Not recorded";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section-card report-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function MenopauseReportPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeCheckIns, setIncludeCheckIns] = useState(true);
  const [includeCareNotes, setIncludeCareNotes] = useState(true);
  const [preview, setPreview] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selectedCheckInIds, setSelectedCheckInIds] = useState<string[] | null>(
    null,
  );
  const [selectedCareNoteIds, setSelectedCareNoteIds] = useState<string[] | null>(
    null,
  );

  const checkIns = useMemo(
    () =>
      profileId
        ? readLocalJson<MenopauseCheckIn[]>(
            `femora.menopause-checkins.v1.${profileId}`,
            [],
          )
        : [],
    [profileId, refresh],
  );

  const careNotes = useMemo(
    () =>
      profileId
        ? readLocalJson<CareNote[]>(
            `femora.menopause-care-notes.v1.${profileId}`,
            [],
          )
        : [],
    [profileId, refresh],
  );

  const filteredCheckIns = useMemo(
    () =>
      [...checkIns]
        .filter((record) => {
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [checkIns, startDate, endDate],
  );

  const filteredCareNotes = useMemo(
    () =>
      [...careNotes]
        .filter((note) => {
          const date = note.appointmentDate || note.followUpDate || note.createdAt?.slice(0, 10) || "";
          if (startDate && date && date < startDate) return false;
          if (endDate && date && date > endDate) return false;
          return true;
        })
        .sort((a, b) => {
          const dateA = a.appointmentDate || a.followUpDate || a.createdAt || "";
          const dateB = b.appointmentDate || b.followUpDate || b.createdAt || "";
          return dateB.localeCompare(dateA);
        }),
    [careNotes, startDate, endDate],
  );

  const selectedCheckIns = filteredCheckIns.filter((record) =>
    selectedCheckInIds === null
      ? true
      : selectedCheckInIds.includes(record.id),
  );

  const selectedCareNotes = filteredCareNotes.filter((note) =>
    selectedCareNoteIds === null
      ? true
      : selectedCareNoteIds.includes(note.id),
  );

  const symptomsSummary = useMemo(() => {
    const counts = new Map<string, number>();

    selectedCheckIns.forEach((record) => {
      record.symptoms?.forEach((symptom) => {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      });
    });

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [selectedCheckIns]);

  function toggleCheckIn(id: string, checked: boolean) {
    const currentIds =
      selectedCheckInIds ?? filteredCheckIns.map((record) => record.id);

    setSelectedCheckInIds(
      checked
        ? [...new Set([...currentIds, id])]
        : currentIds.filter((item) => item !== id),
    );
  }

  function toggleCareNote(id: string, checked: boolean) {
    const currentIds =
      selectedCareNoteIds ?? filteredCareNotes.map((note) => note.id);

    setSelectedCareNoteIds(
      checked
        ? [...new Set([...currentIds, id])]
        : currentIds.filter((item) => item !== id),
    );
  }

  function selectAllCheckIns(checked: boolean) {
    setSelectedCheckInIds(
      checked ? filteredCheckIns.map((record) => record.id) : [],
    );
  }

  function selectAllCareNotes(checked: boolean) {
    setSelectedCareNoteIds(
      checked ? filteredCareNotes.map((note) => note.id) : [],
    );
  }

  function applyDateFilter() {
    setSelectedCheckInIds(null);
    setSelectedCareNoteIds(null);
    setPreview(false);
    setRefresh((value) => value + 1);
  }

  function resetFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedCheckInIds(null);
    setSelectedCareNoteIds(null);
    setPreview(false);
    setRefresh((value) => value + 1);
  }

  function printReport() {
    window.print();
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before preparing a menopause health report.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  const hasSelectedRecords =
    (includeCheckIns && selectedCheckIns.length > 0) ||
    (includeCareNotes && selectedCareNotes.length > 0);

  return (
    <main className="menopause-report-page">
      <style>{`
        .report-section {
          margin-bottom: 20px;
          break-inside: avoid;
        }
        .report-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .report-record {
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 14px;
          margin: 12px 0;
        }
        .report-record p {
          margin: 7px 0;
          overflow-wrap: anywhere;
        }
        .report-field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .report-field input {
          width: 100%;
          min-height: 42px;
          box-sizing: border-box;
        }
        .report-check-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin: 12px 0;
        }
        .report-check-row input {
          margin-top: 4px;
          flex-shrink: 0;
        }
        .report-muted {
          color: var(--muted, #6b7280);
          font-size: 0.92rem;
        }
        .report-print-only {
          display: none;
        }
        @media print {
          body {
            background: #fff !important;
            color: #111 !important;
          }
          .no-print,
          .app-shell-header,
          .app-sidebar,
          .mobile-navigation,
          nav {
            display: none !important;
          }
          .report-print-only {
            display: block !important;
          }
          .menopause-report-page {
            padding: 0 !important;
            margin: 0 !important;
          }
          .menopause-report-page .section-card,
          .menopause-report-page .report-record {
            background: #fff !important;
            color: #111 !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }
          .menopause-report-page .report-section {
            break-inside: avoid;
            margin-bottom: 16px !important;
          }
          .menopause-report-page h1,
          .menopause-report-page h2,
          .menopause-report-page h3,
          .menopause-report-page p {
            color: #111 !important;
          }
          .menopause-report-page a {
            color: #111 !important;
            text-decoration: none !important;
          }
          @page {
            size: auto;
            margin: 16mm;
          }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          eyebrow="MENOPAUSE WELLBEING"
          title="Your menopause health report"
          description="Choose the saved records you want to review, preview the report, and print or save it as a PDF. Your report is prepared from information stored on this device."
          action={
            <Link className="button" to="/menopause">
              Back to dashboard
            </Link>
          }
        />
      </div>

      <div className="report-print-only">
        <h1>FEMORA — Menopause Health Report</h1>
        <p>Profile: {activeProfile.nickname || "My profile"}</p>
        <p>Report prepared: {formatDate(new Date().toISOString().slice(0, 10))}</p>
        <p>
          Period: {startDate ? formatDate(startDate) : "Earliest available"} –{" "}
          {endDate ? formatDate(endDate) : "Latest available"}
        </p>
      </div>

      {!preview ? (
        <>
          <ReportSection title="1. Choose a date range">
            <p className="report-muted">
              Leave either date blank to include all available dates on that side.
            </p>

            <div className="grid grid-2">
              <div className="field report-field">
                <label htmlFor="report-start-date">From</label>
                <input
                  id="report-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="field report-field">
                <label htmlFor="report-end-date">To</label>
                <input
                  id="report-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="report-toolbar" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={applyDateFilter}
              >
                Apply filters
              </button>
              <button
                type="button"
                className="button"
                onClick={resetFilters}
              >
                Clear dates
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Refresh saved records
              </button>
            </div>
          </ReportSection>

          <ReportSection title="2. Choose report sections">
            <label className="report-check-row">
              <input
                type="checkbox"
                checked={includeCheckIns}
                onChange={(event) => setIncludeCheckIns(event.target.checked)}
              />
              <span>
                <strong>Menopause wellbeing check-ins</strong>
                <br />
                <span className="report-muted">
                  Symptoms, stage, severity, mood, sleep, energy and notes.
                  {` ${filteredCheckIns.length} record(s) match the dates.`}
                </span>
              </span>
            </label>

            <label className="report-check-row">
              <input
                type="checkbox"
                checked={includeCareNotes}
                onChange={(event) => setIncludeCareNotes(event.target.checked)}
              />
              <span>
                <strong>Care notes and appointment preparation</strong>
                <br />
                <span className="report-muted">
                  Appointment details, questions, notes and follow-up dates.
                  {` ${filteredCareNotes.length} record(s) match the dates.`}
                </span>
              </span>
            </label>
          </ReportSection>

          {includeCheckIns && (
            <ReportSection title="3. Select check-ins">
              {filteredCheckIns.length === 0 ? (
                <p>
                  No check-ins match this date range. Try clearing the dates or
                  save a check-in first.
                </p>
              ) : (
                <>
                  <label className="report-check-row">
                    <input
                      type="checkbox"
                      checked={
                        filteredCheckIns.length > 0 &&
                        filteredCheckIns.every((record) =>
                          (selectedCheckInIds ?? filteredCheckIns.map((item) => item.id)).includes(record.id),
                        )
                      }
                      onChange={(event) =>
                        selectAllCheckIns(event.target.checked)
                      }
                    />
                    <strong>Select all matching check-ins</strong>
                  </label>

                  {filteredCheckIns.map((record) => {
                    const selected =
                      selectedCheckInIds === null ||
                      selectedCheckInIds.includes(record.id);

                    return (
                      <label className="report-check-row" key={record.id}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) =>
                            toggleCheckIn(record.id, event.target.checked)
                          }
                        />
                        <span>
                          <strong>{formatDate(record.date)}</strong>
                          <br />
                          <span className="report-muted">
                            {record.stage || "Stage not recorded"} ·{" "}
                            {record.symptoms?.length
                              ? record.symptoms.join(", ")
                              : "No symptoms recorded"}
                            {record.severity ? ` · ${record.severity}` : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </ReportSection>
          )}

          {includeCareNotes && (
            <ReportSection title="4. Select care notes">
              {filteredCareNotes.length === 0 ? (
                <p>
                  No care notes match this date range. You can still prepare a
                  report containing check-ins only.
                </p>
              ) : (
                <>
                  <label className="report-check-row">
                    <input
                      type="checkbox"
                      checked={
                        filteredCareNotes.length > 0 &&
                        filteredCareNotes.every((note) =>
                          (selectedCareNoteIds ?? filteredCareNotes.map((item) => item.id)).includes(note.id),
                        )
                      }
                      onChange={(event) =>
                        selectAllCareNotes(event.target.checked)
                      }
                    />
                    <strong>Select all matching care notes</strong>
                  </label>

                  {filteredCareNotes.map((note) => {
                    const selected =
                      selectedCareNoteIds === null ||
                      selectedCareNoteIds.includes(note.id);

                    return (
                      <label className="report-check-row" key={note.id}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) =>
                            toggleCareNote(note.id, event.target.checked)
                          }
                        />
                        <span>
                          <strong>{note.title}</strong>
                          <br />
                          <span className="report-muted">
                            {note.category || "Care note"} ·{" "}
                            Appointment: {formatDate(note.appointmentDate)} ·
                            Follow-up: {formatDate(note.followUpDate)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </ReportSection>
          )}

          <section className="section-card no-print">
            <h2>Ready to preview?</h2>
            <p>
              Your selection includes{" "}
              {includeCheckIns ? selectedCheckIns.length : 0} check-in(s) and{" "}
              {includeCareNotes ? selectedCareNotes.length : 0} care note(s).
            </p>

            {!includeCheckIns && !includeCareNotes && (
              <p role="alert">Select at least one report section.</p>
            )}

            {(includeCheckIns && selectedCheckIns.length === 0) &&
              (includeCareNotes && selectedCareNotes.length === 0) && (
                <p role="alert">
                  Select at least one record, or choose a section with saved
                  records, to create a report.
                </p>
              )}

            <button
              type="button"
              className="button button-primary"
              disabled={!hasSelectedRecords}
              onClick={() => setPreview(true)}
            >
              Preview report
            </button>
          </section>
        </>
      ) : (
        <>
          <section className="section-card no-print" style={{ marginBottom: 20 }}>
            <div className="report-toolbar">
              <button
                type="button"
                className="button"
                onClick={() => setPreview(false)}
              >
                Back to selection
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={printReport}
              >
                Print / Save as PDF
              </button>
            </div>
            <p className="report-muted" style={{ marginBottom: 0 }}>
              In the print window, choose “Save as PDF” as the destination to
              save a copy. Review the report before sharing it with anyone.
            </p>
          </section>

          <ReportSection title="Report summary">
            <p>
              <strong>Profile:</strong>{" "}
              {activeProfile.nickname || "My profile"}
            </p>
            <p>
              <strong>Report period:</strong>{" "}
              {startDate ? formatDate(startDate) : "Earliest available"} –{" "}
              {endDate ? formatDate(endDate) : "Latest available"}
            </p>
            {includeCheckIns && (
              <p>
                <strong>Check-ins included:</strong> {selectedCheckIns.length}
              </p>
            )}
            {includeCareNotes && (
              <p>
                <strong>Care notes included:</strong> {selectedCareNotes.length}
              </p>
            )}
            <p className="report-muted">
              This report summarizes information you recorded. It is not a
              diagnosis or a substitute for advice from a qualified healthcare
              professional.
            </p>
          </ReportSection>

          {includeCheckIns && (
            <>
              <ReportSection title="Recorded symptom summary">
                {symptomsSummary.length === 0 ? (
                  <p>No symptoms were recorded in the selected check-ins.</p>
                ) : (
                  <ul>
                    {symptomsSummary.map(([symptom, count]) => (
                      <li key={symptom}>
                        {symptom} — recorded {count} time(s)
                      </li>
                    ))}
                  </ul>
                )}
              </ReportSection>

              <ReportSection title="Menopause wellbeing check-ins">
                {selectedCheckIns.length === 0 ? (
                  <p>No check-ins selected.</p>
                ) : (
                  selectedCheckIns.map((record) => (
                    <article className="report-record" key={record.id}>
                      <h3>{formatDate(record.date)}</h3>
                      <p>
                        <strong>Stage:</strong>{" "}
                        {record.stage || "Not recorded"}
                      </p>
                      <p>
                        <strong>Symptoms:</strong>{" "}
                        {record.symptoms?.length
                          ? record.symptoms.join(", ")
                          : "None recorded"}
                      </p>
                      <p>
                        <strong>Severity:</strong>{" "}
                        {record.severity || "Not recorded"}
                      </p>
                      <p>
                        <strong>Mood:</strong> {record.mood || "Not recorded"}
                      </p>
                      <p>
                        <strong>Sleep:</strong> {record.sleep || "Not recorded"}
                      </p>
                      <p>
                        <strong>Energy:</strong>{" "}
                        {record.energy || "Not recorded"}
                      </p>
                      {record.notes?.trim() && (
                        <p>
                          <strong>Notes:</strong> {record.notes}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </ReportSection>
            </>
          )}

          {includeCareNotes && (
            <ReportSection title="Care notes and appointment preparation">
              {selectedCareNotes.length === 0 ? (
                <p>No care notes selected.</p>
              ) : (
                selectedCareNotes.map((note) => (
                  <article className="report-record" key={note.id}>
                    <h3>{note.title}</h3>
                    <p>
                      <strong>Category:</strong>{" "}
                      {note.category || "Not specified"}
                    </p>
                    <p>
                      <strong>Appointment date:</strong>{" "}
                      {formatDate(note.appointmentDate)}
                    </p>
                    <p>
                      <strong>Follow-up date:</strong>{" "}
                      {formatDate(note.followUpDate)}
                    </p>
                    <p>
                      <strong>Follow-up status:</strong>{" "}
                      {note.completed ? "Completed" : "Pending"}
                    </p>
                    {note.notes?.trim() && (
                      <p>
                        <strong>Notes:</strong> {note.notes}
                      </p>
                    )}
                    {note.questions?.trim() && (
                      <p>
                        <strong>Questions:</strong> {note.questions}
                      </p>
                    )}
                  </article>
                ))
              )}
            </ReportSection>
          )}

          <section className="section-card">
            <p className="report-muted">
              Privacy: this report is assembled from records stored locally for
              the selected FEMORA profile. Printing or saving creates a copy
              outside the app, so store and share it carefully.
            </p>
          </section>

          <div className="report-toolbar no-print" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="button"
              onClick={() => setPreview(false)}
            >
              Edit selection
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={printReport}
            >
              Print / Save as PDF
            </button>
          </div>
        </>
      )}
    </main>
  );
}
