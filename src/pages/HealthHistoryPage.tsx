
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

type IntakeAnswers = {
  dateOfBirth: string;
  periodStatus: string;
  periodDate: string;
  usualCycleLength: string;
  foodPreference: string;
  acne: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  maritalStatus: string;
  allergies: string;
  healthConditions: string;
  sexualActivity: string;
  workStrain: string;
  sleepQuality: string;
  hotFlashes: string;
  mood: string;
  completedAt?: string;
};

type SavedCheckIn = {
  id: string;
  date: string;
  stage?: string;
  symptoms: string[];
  mood?: string;
  sleep?: string;
  energy?: string;
  pain?: number;
  notes?: string;
  createdAt?: string;
};

type ReportSections = {
  personalDetails: boolean;
  allergies: boolean;
  wellbeing: boolean;
  sexualWellbeing: boolean;
  checkIns: boolean;
};

const defaultSections: ReportSections = {
  personalDetails: true,
  allergies: true,
  wellbeing: true,
  sexualWellbeing: false,
  checkIns: true,
};

const personalFields: { key: keyof IntakeAnswers; label: string }[] = [
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "periodStatus", label: "Menstrual period status" },
  { key: "periodDate", label: "First day of last period" },
  { key: "usualCycleLength", label: "Usual cycle length" },
  { key: "foodPreference", label: "Food preference" },
  { key: "acne", label: "Recent acne" },
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "maritalStatus", label: "Marital status" },
  { key: "sexualActivity", label: "Sexual activity" },
];

const sexualWellbeingFields: { key: keyof IntakeAnswers; label: string }[] = [
  { key: "sexualActivity", label: "Sexual activity" },
];

const wellbeingFields: { key: keyof IntakeAnswers; label: string }[] = [
  { key: "workStrain", label: "Daily routine demands" },
  { key: "sleepQuality", label: "Sleep quality" },
  { key: "hotFlashes", label: "Hot flashes or night sweats" },
  { key: "mood", label: "Recent mood" },
];

const answerLabels: Record<string, string> = {
  yes: "Yes",
  no: "No",
  "not-applicable": "Not applicable",
  "prefer-not": "Prefer not to say",
  vegetarian: "Vegetarian",
  "non-vegetarian": "Non-vegetarian",
  vegan: "Vegan",
  other: "Other",
  sometimes: "Sometimes",
  single: "Single",
  married: "Married",
  partnered: "Partnered",
  low: "Less demanding",
  moderate: "Moderately demanding",
  high: "Very demanding",
  variable: "It varies",
  good: "Good",
  mixed: "Mixed",
  poor: "Poor",
  never: "Never",
  often: "Often",
  unsure: "Not sure",
  okay: "Up and down",
  anxious: "Anxious or stressed",
};

function readIntake(profileId: string): IntakeAnswers | null {
  try {
    const raw = localStorage.getItem(`femora.intake.v1.${profileId}`);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as IntakeAnswers;
  } catch {
    return null;
  }
}

function readCheckIns(profileId: string, journey: string): SavedCheckIn[] {
  const storageKey =
    journey === "maternity"
      ? `femora.maternity-checkins.v1.${profileId}`
      : journey === "menopause"
        ? `femora.menopause-checkins.v1.${profileId}`
        : `femora.menstrual-checkins.v1.${profileId}`;

  try {
    const raw = localStorage.getItem(storageKey);
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
  if (!date) return "Not provided";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readableValue(value: string | undefined): string {
  if (!value?.trim()) return "Not provided";
  return answerLabels[value] ?? value;
}

function getIntakeValue(
  intake: IntakeAnswers,
  key: keyof IntakeAnswers,
): string {
  const value = intake[key];

  if (key === "dateOfBirth" || key === "periodDate") {
    return value ? formatDate(value) : "Not provided";
  }

  if (key === "height") {
    return value
      ? `${value} ${intake.heightUnit || "cm"}`
      : "Not provided";
  }

  if (key === "weight") {
    return value
      ? `${value} ${intake.weightUnit || "kg"}`
      : "Not provided";
  }

  if (key === "usualCycleLength") {
    return intake.periodStatus === "yes" && value
      ? `${value} days`
      : "Not provided / not applicable";
  }

  return readableValue(value);
}

function getJourneyDetails(journey: string) {
  if (journey === "maternity") {
    return {
      title: "Maternity health history",
      description:
        "Review your personal health profile and saved maternity wellbeing records.",
      checkInLabel: "Maternity check-ins",
      emptyMessage: "No maternity check-ins are saved for this profile yet.",
      checkInPath: "/maternity/check-in",
      dashboardPath: "/maternity/dashboard",
    };
  }

  if (journey === "menopause") {
    return {
      title: "Menopause health history",
      description:
        "Review your personal health profile and saved menopause wellbeing records.",
      checkInLabel: "Menopause check-ins",
      emptyMessage: "No menopause check-ins are saved for this profile yet.",
      checkInPath: "/menopause/check-in",
      dashboardPath: "/menopause/dashboard",
    };
  }

  return {
    title: "Menstrual health history",
    description:
      "Review your personal health profile and saved menstrual wellbeing records.",
    checkInLabel: "Menstrual check-ins",
    emptyMessage:
      "No menstrual wellbeing check-ins are saved for this profile yet.",
    checkInPath: "/menstrual/check-in",
    dashboardPath: "/menstrual",
  };
}

export default function HealthHistoryPage() {
  const { activeProfile } = useAppContext();
  const [exportError, setExportError] = useState("");
  const [sections, setSections] =
    useState<ReportSections>(defaultSections);

  const journey = activeProfile?.journey ?? "menstrual";
  const details = getJourneyDetails(journey);

  const intake = useMemo(
    () => (activeProfile ? readIntake(activeProfile.id) : null),
    [activeProfile?.id],
  );

  const checkIns = useMemo(
    () =>
      activeProfile
        ? readCheckIns(activeProfile.id, journey)
        : [],
    [activeProfile?.id, journey],
  );

  const sortedCheckIns = useMemo(
    () => [...checkIns].sort((a, b) => b.date.localeCompare(a.date)),
    [checkIns],
  );

  const sectionOptions: {
    key: keyof ReportSections;
    title: string;
    description: string;
  }[] = [
    {
      key: "personalDetails",
      title: "Personal details",
      description:
        "Date of birth, period information, food preference, height, weight and other personal answers.",
    },
    {
      key: "allergies",
      title: "Allergies & health conditions",
      description:
        "Your saved allergies and existing health conditions or notes.",
    },
    {
      key: "wellbeing",
      title: "Lifestyle & wellbeing answers",
      description:
        "Daily routine, sleep, hot flashes, mood and related onboarding answers.",
    },
    {
      key: "sexualWellbeing",
      title: "Sexual Wellbeing (optional)",
      description:
        "Sexual activity information from onboarding. This section is excluded by default and is included only if you select it.",
    },
    {
      key: "checkIns",
      title: "Saved wellbeing check-ins",
      description:
        "Symptoms, dates, mood, sleep, energy, pain and notes from this journey.",
    },
  ];

  const selectedCount = Object.values(sections).filter(Boolean).length;

  function toggleSection(key: keyof ReportSections) {
    setSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setExportError("");
  }

  function downloadPdf() {
    setExportError("");

    if (!activeProfile) {
      setExportError("Choose a profile before exporting your records.");
      return;
    }

    if (selectedCount === 0) {
      setExportError("Select at least one section to include in the PDF.");
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const left = 18;
      const contentWidth = pdf.internal.pageSize.getWidth() - left - 18;
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
        const gap = options?.gap ?? 2;
        const lines = pdf.splitTextToSize(text, contentWidth - indent);

        addPageIfNeeded(lines.length * 6 + gap);
        pdf.text(lines, left + indent, y);
        y += lines.length * 6 + gap;
      };

      const addSectionTitle = (title: string) => {
        addPageIfNeeded(16);
        y += 3;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.text(title, left, y);
        y += 8;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("FEMORA", left, y);
      y += 10;

      pdf.setFontSize(15);
      pdf.text(details.title, left, y);
      y += 9;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      addWrappedText(
        `Profile: ${activeProfile.nickname || activeProfile.id}`,
      );
      addWrappedText(`Journey: ${journey}`);
      addWrappedText(`Exported: ${new Date().toLocaleString()}`);
      y += 2;

      if (sections.personalDetails) {
        addSectionTitle("Personal details");

        if (!intake) {
          addWrappedText(
            "No completed onboarding profile was found for this profile.",
          );
        } else {
          personalFields.forEach(({ key, label }) => {
            addWrappedText(
              `${label}: ${getIntakeValue(intake, key)}`,
              { indent: 2 },
            );
          });
        }
      }

      if (sections.allergies) {
        addSectionTitle("Allergies & health conditions");

        if (!intake) {
          addWrappedText("No completed onboarding profile was found.");
        } else {
          addWrappedText(
            `Allergies: ${readableValue(intake.allergies)}`,
            { indent: 2 },
          );
          addWrappedText(
            `Existing health conditions or notes: ${readableValue(intake.healthConditions)}`,
            { indent: 2 },
          );
        }
      }

      if (sections.wellbeing) {
        addSectionTitle("Lifestyle & wellbeing answers");

        if (!intake) {
          addWrappedText("No completed onboarding profile was found.");
        } else {
          wellbeingFields.forEach(({ key, label }) => {
            addWrappedText(
              `${label}: ${getIntakeValue(intake, key)}`,
              { indent: 2 },
            );
          });
        }
      }

      if (sections.sexualWellbeing) {
        addSectionTitle("Sexual Wellbeing (optional)");

        if (!intake) {
          addWrappedText("No completed onboarding profile was found.");
        } else {
          sexualWellbeingFields.forEach(({ key, label }) => {
            addWrappedText(`${label}: ${getIntakeValue(intake, key)}`, {
              indent: 2,
            });
          });
        }
      }

      if (sections.checkIns) {
        addSectionTitle("Saved wellbeing check-ins");
        addWrappedText(`${details.checkInLabel}: ${checkIns.length}`);

        if (sortedCheckIns.length === 0) {
          addWrappedText(details.emptyMessage);
        } else {
          sortedCheckIns.forEach((entry, index) => {
            addPageIfNeeded(30);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.text(
              `Check-in ${index + 1} — ${formatDate(entry.date)}`,
              left,
              y,
            );
            y += 7;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);

            if (entry.stage) {
              addWrappedText(`Stage: ${entry.stage}`, { indent: 3 });
            }

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

            y += 3;
            addPageIfNeeded(8);
            pdf.setDrawColor(225, 225, 225);
            pdf.line(left, y, left + contentWidth, y);
            y += 6;
          });
        }
      }

      addPageIfNeeded(20);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      addWrappedText(
        "Personal record only. This report does not provide a diagnosis or replace professional medical advice. The report includes only the sections selected by the user.",
      );

      pdf.save(`FEMORA-${journey}-health-history.pdf`);
    } catch {
      setExportError("The PDF could not be generated. Please try again.");
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
    <main>
      <PageHeader
        eyebrow="YOUR RECORDS"
        title={details.title}
        description={details.description}
      />

      <section className="section-card">
        <div className="button-row">
          <Link className="button button-secondary" to={details.dashboardPath}>
            Back to dashboard
          </Link>
        </div>

        <h2 style={{ marginTop: 24 }}>Customize your health report</h2>
        <p className="field-help">
          Choose which sections to include in your downloaded PDF. These
          choices only affect the report; your saved records remain unchanged.
        </p>

        <div className="button-row" style={{ marginTop: 16 }}>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setSections({
                personalDetails: true,
                allergies: true,
                wellbeing: true,
                sexualWellbeing: true,
                checkIns: true,
              });
              setExportError("");
            }}
          >
            Select all
          </button>

          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setSections({
                personalDetails: false,
                allergies: false,
                wellbeing: false,
                sexualWellbeing: false,
                checkIns: false,
              });
              setExportError("");
            }}
          >
            Clear all
          </button>
        </div>

        <div className="stack-list" style={{ marginTop: 16 }}>
          {sectionOptions.map((option) => (
            <label
              className="section-card"
              key={option.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={sections[option.key]}
                onChange={() => toggleSection(option.key)}
                style={{ marginTop: 5 }}
              />

              <span>
                <strong>{option.title}</strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 5,
                    color: "var(--text-muted, #666)",
                  }}
                >
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        <p className="field-help">
          {selectedCount} of {sectionOptions.length} sections selected.
        </p>

        {exportError && (
          <p className="error-text" role="alert">
            {exportError}
          </p>
        )}

        <button
          className="button button-primary"
          type="button"
          onClick={downloadPdf}
        >
          Download selected sections as PDF
        </button>

        <h2 style={{ marginTop: 32 }}>Personal health profile</h2>

        {!intake ? (
          <div className="empty-state">
            <h3>No onboarding profile found</h3>
            <p>
              Complete onboarding for this profile to save your personal health
              information here.
            </p>
          </div>
        ) : (
          <>
            <h3>Personal details</h3>
            <div className="stack-list">
              {personalFields.map(({ key, label }) => (
                <article className="section-card" key={key}>
                  <strong>{label}</strong>
                  <p>{getIntakeValue(intake, key)}</p>
                </article>
              ))}
            </div>

            <h3 style={{ marginTop: 20 }}>Allergies & health conditions</h3>
            <article className="section-card">
              <p>
                <strong>Allergies:</strong>{" "}
                {readableValue(intake.allergies)}
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>
                <strong>Existing health conditions or notes:</strong>{" "}
                {readableValue(intake.healthConditions)}
              </p>
            </article>

            <h3 style={{ marginTop: 20 }}>Lifestyle & wellbeing answers</h3>
            <div className="stack-list">
              {wellbeingFields.map(({ key, label }) => (
                <article className="section-card" key={key}>
                  <strong>{label}</strong>
                  <p>{getIntakeValue(intake, key)}</p>
                </article>
              ))}
            </div>

            <h3 style={{ marginTop: 20 }}>Sexual Wellbeing (optional)</h3>
            <article className="section-card">
              <strong>Sexual activity</strong>
              <p>{getIntakeValue(intake, "sexualActivity")}</p>
              <p className="field-help">
                This information is kept separate in the report and is not
                included in the PDF unless you select its checkbox.
              </p>
            </article>
          </>
        )}

        <h2 style={{ marginTop: 28 }}>Saved check-ins</h2>

        {checkIns.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">♡</span>
            <h3>Your history will appear here</h3>
            <p>{details.emptyMessage}</p>
          </div>
        ) : (
          <div className="stack-list">
            {sortedCheckIns.map((entry) => (
              <article className="section-card" key={entry.id}>
                <h3>{formatDate(entry.date)}</h3>

                {entry.stage && (
                  <p><strong>Stage:</strong> {entry.stage}</p>
                )}

                <p>
                  <strong>Symptoms:</strong>{" "}
                  {entry.symptoms.length
                    ? entry.symptoms.join(", ")
                    : "None selected"}
                </p>

                {entry.mood && <p><strong>Mood:</strong> {entry.mood}</p>}
                {entry.sleep && <p><strong>Sleep:</strong> {entry.sleep}</p>}
                {entry.energy && <p><strong>Energy:</strong> {entry.energy}</p>}

                {entry.pain !== undefined && (
                  <p><strong>Pain level:</strong> {entry.pain}/10</p>
                )}

                {entry.notes && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Notes:</strong> {entry.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="field-help" style={{ marginTop: 18 }}>
          Records are read from this profile's browser storage on this device.
          Birth plans, hospital checklists, appointments and other separately
          stored records are not included in this version of the report.
        </p>
      </section>
    </main>
  );
}
