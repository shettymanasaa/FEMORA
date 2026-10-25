
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";

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

function readCheckIns(profileId: string): SavedCheckIn[] {
  if (!profileId) return [];

  try {
    const raw = localStorage.getItem(
      `femora.menstrual-checkins.v1.${profileId}`,
    );
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as SavedCheckIn[]) : [];
  } catch {
    return [];
  }
}

export default function ReportPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const [refreshKey, setRefreshKey] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [preview, setPreview] = useState(false);

  const allCheckIns = useMemo(
    () => readCheckIns(profileId),
    [profileId, refreshKey],
  );

  const filteredCheckIns = useMemo(
    () =>
      [...allCheckIns]
        .filter((record) => {
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allCheckIns, startDate, endDate],
  );

  const selectedCheckIns = filteredCheckIns.filter((record) =>
    selectedIds === null ? true : selectedIds.includes(record.id),
  );

  const symptomSummary = useMemo(() => {
    const counts = new Map<string, number>();

    selectedCheckIns.forEach((record) => {
      record.symptoms?.forEach((symptom) => {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      });
    });

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [selectedCheckIns]);

  function toggleRecord(id: string, checked: boolean) {
    const currentIds =
      selectedIds ?? filteredCheckIns.map((record) => record.id);

    setSelectedIds(
      checked
        ? [...new Set([...currentIds, id])]
        : currentIds.filter((item) => item !== id),
    );
  }

  function selectAll(checked: boolean) {
    setSelectedIds(
      checked ? filteredCheckIns.map((record) => record.id) : [],
    );
  }

  function applyFilters() {
    setSelectedIds(null);
    setPreview(false);
    setRefreshKey((value) => value + 1);
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedIds(null);
    setPreview(false);
    setRefreshKey((value) => value + 1);
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before preparing your menstrual health report.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <main className="menstrual-report-page">
      <style>{`
        .menstrual-report-page .report-record {
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          overflow-wrap: anywhere;
          break-inside: avoid;
        }

        .menstrual-report-page .report-record p {
          margin: 8px 0;
        }

        .menstrual-report-page .report-check {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 14px 0;
        }

        .menstrual-report-page .report-check input {
          margin-top: 4px;
          flex-shrink: 0;
        }

        .menstrual-report-page .report-muted {
          color: var(--muted, #6b7280);
          font-size: 0.92rem;
        }

        .menstrual-report-page .report-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .menstrual-report-page .report-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .menstrual-report-page .report-field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .menstrual-report-page .report-field input {
          width: 100%;
          min-height: 42px;
          box-sizing: border-box;
        }

        .menstrual-report-page .print-heading {
          display: none;
        }

        @media (max-width: 600px) {
          .menstrual-report-page .report-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          body {
            background: white !important;
            color: #111 !important;
          }

          .menstrual-report-page .no-print,
          .app-shell-header,
          .app-sidebar,
          .mobile-navigation,
          nav {
            display: none !important;
          }

          .menstrual-report-page .print-heading {
            display: block !important;
          }

          .menstrual-report-page .section-card,
          .menstrual-report-page .report-record {
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
            border-color: #ddd !important;
          }

          .menstrual-report-page h1,
          .menstrual-report-page h2,
          .menstrual-report-page h3,
          .menstrual-report-page p,
          .menstrual-report-page li {
            color: #111 !important;
          }

          .menstrual-report-page .report-muted {
            color: #444 !important;
          }

          .menstrual-report-page .report-record,
          .menstrual-report-page .section-card {
            break-inside: avoid;
          }

          @page {
            margin: 16mm;
          }
        }
      `}</style>

      <div className="no-print">
        <PageHeader
          eyebrow="MENSTRUAL WELLBEING"
          title="Your menstrual health report"
          description="Choose a date range and select the check-ins you want to include. Preview your records before printing or saving the report as a PDF."
          action={
            <Link className="button" to="/menstrual">
              Back to dashboard
            </Link>
          }
        />
      </div>

      {preview && (
        <header className="print-heading">
          <h1>FEMORA — Menstrual Health Report</h1>
          <p>Profile: {activeProfile.nickname || "My profile"}</p>
          <p>
            Prepared on {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
          <p>
            Period: {startDate ? formatDate(startDate) : "Earliest available"}{" "}
            – {endDate ? formatDate(endDate) : "Latest available"}
          </p>
        </header>
      )}

      {!preview ? (
        <>
          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>1. Choose a date range</h2>
            <p className="report-muted">
              Leave the dates blank to include all available check-ins.
            </p>

            <div className="report-grid">
              <div className="report-field">
                <label htmlFor="menstrual-report-from">From</label>
                <input
                  id="menstrual-report-from"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>

              <div className="report-field">
                <label htmlFor="menstrual-report-to">To</label>
                <input
                  id="menstrual-report-to"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="report-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={applyFilters}
              >
                Apply filters
              </button>

              <button
                type="button"
                className="button"
                onClick={clearFilters}
              >
                Clear dates
              </button>

              <button
                type="button"
                className="button"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Refresh records
              </button>
            </div>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>2. Select check-ins</h2>
            <p>
              {filteredCheckIns.length} check-in(s) match the selected dates.
            </p>

            {filteredCheckIns.length === 0 ? (
              <p>
                No saved check-ins found for this period. Clear the date filters
                or save a check-in first.
              </p>
            ) : (
              <>
                <label className="report-check">
                  <input
                    type="checkbox"
                    checked={filteredCheckIns.every((record) =>
                      (selectedIds ?? filteredCheckIns.map((item) => item.id))
                        .includes(record.id),
                    )}
                    onChange={(event) => selectAll(event.target.checked)}
                  />
                  <strong>Select all matching check-ins</strong>
                </label>

                {filteredCheckIns.map((record) => (
                  <label className="report-check" key={record.id}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds === null ||
                        selectedIds.includes(record.id)
                      }
                      onChange={(event) =>
                        toggleRecord(record.id, event.target.checked)
                      }
                    />

                    <span>
                      <strong>{formatDate(record.date)}</strong>
                      <br />
                      <span className="report-muted">
                        {record.symptoms?.length
                          ? record.symptoms.join(", ")
                          : "No symptoms recorded"}
                        {record.pain !== undefined
                          ? ` · Pain: ${record.pain}/10`
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </>
            )}
          </section>

          <section className="section-card no-print">
            <h2>3. Preview your report</h2>
            <p>
              {selectedCheckIns.length} selected check-in(s) will be included.
            </p>

            <button
              type="button"
              className="button button-primary"
              disabled={selectedCheckIns.length === 0}
              onClick={() => setPreview(true)}
            >
              Preview report
            </button>
          </section>
        </>
      ) : (
        <>
          <section
            className="section-card no-print"
            style={{ marginBottom: 20 }}
          >
            <div className="report-actions">
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
                onClick={() => window.print()}
              >
                Print / Save as PDF
              </button>
            </div>

            <p className="report-muted">
              In the print dialog, choose “Save as PDF” to save a copy.
            </p>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Report summary</h2>
            <p>
              <strong>Profile:</strong>{" "}
              {activeProfile.nickname || "My profile"}
            </p>
            <p>
              <strong>Check-ins included:</strong> {selectedCheckIns.length}
            </p>
            <p>
              <strong>Period:</strong>{" "}
              {startDate ? formatDate(startDate) : "Earliest available"} –{" "}
              {endDate ? formatDate(endDate) : "Latest available"}
            </p>
            <p className="report-muted">
              This report summarizes the information you recorded. It is not a
              diagnosis or a substitute for professional healthcare advice.
            </p>
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Symptom summary</h2>

            {symptomSummary.length === 0 ? (
              <p>No symptoms were recorded in the selected check-ins.</p>
            ) : (
              <ul>
                {symptomSummary.map(([symptom, count]) => (
                  <li key={symptom}>
                    {symptom}: recorded {count} time(s)
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-card" style={{ marginBottom: 20 }}>
            <h2>Detailed check-ins</h2>

            {selectedCheckIns.map((record) => (
              <article className="report-record" key={record.id}>
                <h3>{formatDate(record.date)}</h3>

                <p>
                  <strong>Symptoms:</strong>{" "}
                  {record.symptoms?.length
                    ? record.symptoms.join(", ")
                    : "None recorded"}
                </p>

                <p>
                  <strong>Pain level:</strong>{" "}
                  {record.pain !== undefined
                    ? `${record.pain}/10`
                    : "Not recorded"}
                </p>

                <p>
                  <strong>Mood:</strong> {record.mood || "Not recorded"}
                </p>

                <p>
                  <strong>Sleep:</strong> {record.sleep || "Not recorded"}
                </p>

                <p>
                  <strong>Energy:</strong> {record.energy || "Not recorded"}
                </p>

                {record.notes?.trim() && (
                  <p>
                    <strong>Notes:</strong> {record.notes}
                  </p>
                )}
              </article>
            ))}
          </section>

          <section className="section-card">
            <h2>Privacy note</h2>
            <p className="report-muted">
              This report is generated from check-ins saved for the selected
              profile on this device. Printing or saving creates a separate
              copy, so store it securely and share it only with people you
              choose.
            </p>
          </section>

          <div className="report-actions no-print" style={{ marginTop: 20 }}>
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
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </button>
          </div>
        </>
      )}
    </main>
  );
}
