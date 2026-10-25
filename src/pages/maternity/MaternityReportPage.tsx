import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { readLocalJson } from "../../lib/utils";

type MaternityCheckIn = {
  id: string;
  date: string;
  stage: string;
  symptoms: string[];
  mood?: string;
  energy?: string;
  notes?: string;
  createdAt: string;
};

type BirthPlan = {
  preferences: string;
  supportPerson: string;
  painRelief: string;
  birthEnvironment: string;
  feedingDiscussion: string;
  questions: string;
  notes: string;
  updatedAt: string;
};

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

export default function MaternityReportPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const checkIns = profileId
    ? readLocalJson<MaternityCheckIn[]>(
        `femora.maternity-checkins.v1.${profileId}`,
        [],
      )
    : [];

  const birthPlan = profileId
    ? readLocalJson<BirthPlan>(
        `femora.maternity-birth-plan.v1.${profileId}`,
        {
          preferences: "",
          supportPerson: "",
          painRelief: "",
          birthEnvironment: "",
          feedingDiscussion: "",
          questions: "",
          notes: "",
          updatedAt: "",
        },
      )
    : null;

  const postpartumRecords = profileId
    ? readLocalJson<PostpartumRecord[]>(
        `femora.maternity-postpartum.v1.${profileId}`,
        [],
      )
    : [];

  const [includeCheckIns, setIncludeCheckIns] = useState(true);
  const [includeBirthPlan, setIncludeBirthPlan] = useState(true);
  const [includePostpartum, setIncludePostpartum] = useState(true);

  const [preview, setPreview] = useState(false);

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile</h1>
        <p>Select a profile before preparing a maternity report.</p>
        <Link className="button button-primary" to="/profiles">
          Go to profiles
        </Link>
      </section>
    );
  }

  const hasBirthPlan = Boolean(
    birthPlan &&
      birthPlan.updatedAt &&
      [
        birthPlan.preferences,
        birthPlan.supportPerson,
        birthPlan.painRelief,
        birthPlan.birthEnvironment,
        birthPlan.feedingDiscussion,
        birthPlan.questions,
        birthPlan.notes,
      ].some((value) => value.trim()),
  );

  function printReport() {
    window.print();
  }

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY HEALTH"
        title="Your maternity report"
        description="Choose which locally saved records to include, preview your report, and print or save it as a PDF. Nothing is shared automatically."
      />

      <div className="section-card no-print" style={{ marginBottom: 20 }}>
        <h2>1. Select records</h2>
        <p>Choose the sections you want in your report.</p>

        <label className="check-row">
          <input
            type="checkbox"
            checked={includeCheckIns}
            onChange={(event) => setIncludeCheckIns(event.target.checked)}
          />
          <span>
            Maternity check-ins ({checkIns.length} saved)
          </span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={includeBirthPlan}
            onChange={(event) => setIncludeBirthPlan(event.target.checked)}
          />
          <span>
            Birth plan ({hasBirthPlan ? "saved" : "no details saved"})
          </span>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={includePostpartum}
            onChange={(event) => setIncludePostpartum(event.target.checked)}
          />
          <span>
            Postpartum records ({postpartumRecords.length} saved)
          </span>
        </label>

        <div className="button-row" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setPreview(true)}
          >
            Preview report
          </button>

          <Link
            to="/maternity/dashboard"
            className="button button-secondary"
          >
            Back to maternity
          </Link>
        </div>
      </div>

      {preview && (
        <>
          <div className="section-card no-print" style={{ marginBottom: 20 }}>
            <h2>2. Export report</h2>
            <p>
              Review the report below. To create a PDF, select Print and choose
              “Save as PDF” in your browser's print window.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={printReport}
            >
              Print / Save as PDF
            </button>
          </div>

          <article className="maternity-report-preview">
            <header className="report-heading">
              <h1>FEMORA — Maternity Health Report</h1>
              <p>Prepared on: {new Date().toLocaleDateString()}</p>
              <p>Profile: {activeProfile.id}</p>
              <p>
                This report contains selected personal records for discussion
                with a qualified healthcare professional.
              </p>
            </header>

            {includeCheckIns && (
              <ReportSection title="Maternity check-ins">
                {checkIns.length === 0 ? (
                  <p>No maternity check-ins have been saved.</p>
                ) : (
                  [...checkIns]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((record) => (
                      <div className="report-record" key={record.id}>
                        <h3>{record.date} — {record.stage}</h3>
                        <p>
                          <strong>Symptoms:</strong>{" "}
                          {record.symptoms.join(", ") || "None recorded"}
                        </p>
                        <p><strong>Mood:</strong> {record.mood || "Not recorded"}</p>
                        <p><strong>Energy:</strong> {record.energy || "Not recorded"}</p>
                        {record.notes && (
                          <p className="report-preserve-text">
                            <strong>Notes:</strong> {record.notes}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </ReportSection>
            )}

            {includeBirthPlan && (
              <ReportSection title="Birth plan">
                {!hasBirthPlan || !birthPlan ? (
                  <p>No birth plan details have been saved.</p>
                ) : (
                  <>
                    <p>
                      <strong>Last updated:</strong>{" "}
                      {new Date(birthPlan.updatedAt).toLocaleString()}
                    </p>
                    {birthPlan.preferences && (
                      <p className="report-preserve-text">
                        <strong>Preferences:</strong> {birthPlan.preferences}
                      </p>
                    )}
                    {birthPlan.supportPerson && (
                      <p><strong>Support person:</strong> {birthPlan.supportPerson}</p>
                    )}
                    {birthPlan.birthEnvironment && (
                      <p className="report-preserve-text">
                        <strong>Birth environment:</strong> {birthPlan.birthEnvironment}
                      </p>
                    )}
                    {birthPlan.painRelief && (
                      <p className="report-preserve-text">
                        <strong>Pain relief discussions:</strong> {birthPlan.painRelief}
                      </p>
                    )}
                    {birthPlan.feedingDiscussion && (
                      <p className="report-preserve-text">
                        <strong>Feeding and early care:</strong> {birthPlan.feedingDiscussion}
                      </p>
                    )}
                    {birthPlan.questions && (
                      <p className="report-preserve-text">
                        <strong>Questions for care team:</strong> {birthPlan.questions}
                      </p>
                    )}
                    {birthPlan.notes && (
                      <p className="report-preserve-text">
                        <strong>Additional notes:</strong> {birthPlan.notes}
                      </p>
                    )}
                  </>
                )}
              </ReportSection>
            )}

            {includePostpartum && (
              <ReportSection title="Postpartum records">
                {postpartumRecords.length === 0 ? (
                  <p>No postpartum records have been saved.</p>
                ) : (
                  [...postpartumRecords]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((record) => (
                      <div className="report-record" key={record.id}>
                        <h3>{record.date}</h3>
                        <p>
                          <strong>Wellbeing:</strong>{" "}
                          {record.wellbeing || "Not recorded"}
                        </p>
                        <p>
                          <strong>Mood:</strong> {record.mood || "Not recorded"}
                        </p>
                        {record.notes && (
                          <p className="report-preserve-text">
                            <strong>Notes:</strong> {record.notes}
                          </p>
                        )}
                        {record.followUpDate && (
                          <p>
                            <strong>Follow-up date:</strong> {record.followUpDate}
                          </p>
                        )}
                        {record.followUpQuestions && (
                          <p className="report-preserve-text">
                            <strong>Follow-up questions:</strong>{" "}
                            {record.followUpQuestions}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </ReportSection>
            )}

            <footer className="report-footer">
              <p>
                This report reflects information saved in FEMORA at the time
                it was prepared. It is not a diagnosis, emergency assessment,
                or substitute for professional medical advice. Check the
                details before sharing this document.
              </p>
            </footer>
          </article>
        </>
      )}
    </main>
  );
}
