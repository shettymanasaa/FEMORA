
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

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

function readCheckIns(profileId: string): SavedCheckIn[] {
  try {
    const raw = localStorage.getItem(
      `femora.menstrual-checkins.v1.${profileId}`,
    );
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is SavedCheckIn =>
        item !== null &&
        typeof item === "object" &&
        typeof item.date === "string" &&
        Array.isArray(item.symptoms),
    );
  } catch {
    return [];
  }
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HealthHistoryPage() {
  const { activeProfile } = useAppContext();
  const [exportError, setExportError] = useState("");

  const checkIns = useMemo(
    () => (activeProfile ? readCheckIns(activeProfile.id) : []),
    [activeProfile],
  );

  function downloadPdf() {
    setExportError("");

    if (!activeProfile) {
      setExportError("Choose a profile before exporting your records.");
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const left = 18;
      const right = 18;
      const contentWidth =
        pdf.internal.pageSize.getWidth() - left - right;
      let y = 20;

      const addPageIfNeeded = (neededHeight = 10) => {
        if (y + neededHeight > pageHeight - 18) {
          pdf.addPage();
          y = 20;
        }
      };

      const addWrappedText = (
        text: string,
        options?: { indent?: number; gap?: number },
      ) => {
        const indent = options?.indent ?? 0;
        const lines = pdf.splitTextToSize(
          text,
          contentWidth - indent,
        );

        addPageIfNeeded(lines.length * 6 + (options?.gap ?? 2));
        pdf.text(lines, left + indent, y);
        y += lines.length * 6 + (options?.gap ?? 2);
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("FEMORA", left, y);
      y += 10;

      pdf.setFontSize(15);
      pdf.text("Personal Health History", left, y);
      y += 9;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      addWrappedText(`Journey: ${activeProfile.journey}`);
      addWrappedText(`Exported: ${new Date().toLocaleString()}`);
      addWrappedText(`Saved check-ins: ${checkIns.length}`);
      y += 3;

      pdf.setDrawColor(210, 170, 185);
      pdf.line(left, y, left + contentWidth, y);
      y += 8;

      if (checkIns.length === 0) {
        addWrappedText(
          "No menstrual wellbeing check-ins are saved for this profile yet.",
        );
      } else {
        const sorted = [...checkIns].sort((a, b) =>
          b.date.localeCompare(a.date),
        );

        sorted.forEach((entry, index) => {
          addPageIfNeeded(35);

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.text(
            `Check-in ${index + 1} — ${formatDate(entry.date)}`,
            left,
            y,
          );
          y += 8;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);

          addWrappedText(
            `Symptoms: ${
              entry.symptoms.length
                ? entry.symptoms.join(", ")
                : "None selected"
            }`,
            { indent: 3 },
          );

          if (entry.mood) {
            addWrappedText(`Mood: ${entry.mood}`, { indent: 3 });
          }
          if (entry.sleep) {
            addWrappedText(`Sleep: ${entry.sleep}`, { indent: 3 });
          }
          if (entry.energy) {
            addWrappedText(`Energy: ${entry.energy}`, { indent: 3 });
          }
          if (entry.pain !== undefined) {
            addWrappedText(`Pain level: ${entry.pain}/10`, {
              indent: 3,
            });
          }
          if (entry.notes) {
            addWrappedText(`Notes: ${entry.notes}`, { indent: 3 });
          }

          y += 4;
          addPageIfNeeded(8);
          pdf.setDrawColor(225, 225, 225);
          pdf.line(left, y, left + contentWidth, y);
          y += 7;
        });
      }

      addPageIfNeeded(20);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      addWrappedText(
        "Personal record only. This report does not provide a diagnosis or replace professional medical advice.",
      );

      pdf.save("FEMORA-health-history.pdf");
    } catch {
      setExportError(
        "The PDF could not be generated. Please try again.",
      );
    }
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile to view or export its health history.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="YOUR RECORDS"
        title="Health history"
        description="Review your saved menstrual wellbeing check-ins and export a personal PDF report."
      />

      <section className="section-card">
        <div className="button-row">
          <button
            className="button button-primary"
            type="button"
            onClick={downloadPdf}
          >
            Download PDF
          </button>
          <Link
            className="button button-secondary"
            to="/menstrual/check-in"
          >
            Add check-in
          </Link>
        </div>

        {exportError && (
          <p className="error-text" role="alert">
            {exportError}
          </p>
        )}

        <h2 style={{ marginTop: 24 }}>Saved check-ins</h2>

        {checkIns.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ♡
            </span>
            <h3>Your history will appear here</h3>
            <p>
              No menstrual check-ins have been saved for this profile yet.
              Add a check-in to begin building your personal history.
            </p>
          </div>
        ) : (
          <div className="stack-list">
            {[...checkIns]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <article className="section-card" key={entry.id}>
                  <h3>{formatDate(entry.date)}</h3>
                  <p>
                    <strong>Symptoms:</strong>{" "}
                    {entry.symptoms.length
                      ? entry.symptoms.join(", ")
                      : "None selected"}
                  </p>
                  {entry.mood && (
                    <p><strong>Mood:</strong> {entry.mood}</p>
                  )}
                  {entry.sleep && (
                    <p><strong>Sleep:</strong> {entry.sleep}</p>
                  )}
                  {entry.energy && (
                    <p><strong>Energy:</strong> {entry.energy}</p>
                  )}
                  {entry.pain !== undefined && (
                    <p><strong>Pain level:</strong> {entry.pain}/10</p>
                  )}
                  {entry.notes && (
                    <p><strong>Notes:</strong> {entry.notes}</p>
                  )}
                </article>
              ))}
          </div>
        )}

        <p className="field-help" style={{ marginTop: 18 }}>
          Records are read from this profile's browser storage on this
          device. The PDF currently includes menstrual wellbeing
          check-ins only; other journeys and appointment records are
          not included yet.
        </p>
      </section>
    </div>
  );
}
