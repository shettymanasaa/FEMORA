import { Link, useNavigate } from "react-router-dom";
import { JOURNEYS } from "../lib/constants";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function HomePage() {
  const { activeProfile } = useAppContext();
  const navigate = useNavigate();
  const selectedJourney = JOURNEYS.find(
    (journey) => journey.id === activeProfile?.journey,
  );

  return (
    <div>
      <PageHeader
        eyebrow="YOUR OVERVIEW"
        title={`Welcome, ${activeProfile?.nickname ?? "there"}.`}
        description="Your health journey, in one calm and personal space."
        action={
          <button
            className="button button-secondary"
            type="button"
            onClick={() => navigate("/select-journey")}
          >
            Change journey
          </button>
        }
      />

      {selectedJourney ? (
        <section className="hero-panel">
          <div>
            <p className="eyebrow">YOUR CURRENT JOURNEY</p>
            <h2>{selectedJourney.title}</h2>
            <p>{selectedJourney.description}</p>
            <Link
              className="button button-primary"
              to={
                selectedJourney.id === "menstrual"
                  ? "/menstrual"
                  : selectedJourney.id === "maternity"
                    ? "/maternity/dashboard"
                    : "/menopause/dashboard"
              }
            >
              Open my journey →
            </Link>
          </div>
          <div className="hero-panel-symbol" aria-hidden="true">
            {selectedJourney.symbol}
          </div>
        </section>
      ) : (
        <section className="section-card">
          <h2>Choose your journey</h2>
          <p>Select the health journey you would like to explore.</p>
          <Link className="button button-primary" to="/select-journey">
            Choose journey
          </Link>
        </section>
      )}

      <div className="grid grid-3" style={{ marginTop: 22 }}>
        <section className="section-card">
          <span className="journey-symbol">✎</span>
          <h2>Daily check-in</h2>
          <p>Record how you feel when the appropriate local tracking module is connected.</p>
          <Link className="text-link" to={selectedJourney?.id === "maternity" ? "/maternity/check-in" : selectedJourney?.id === "menopause" ? "/menopause/check-in" : "/menstrual/check-in"}>
            Open check-in →
          </Link>
        </section>
        <section className="section-card">
          <span className="journey-symbol">✧</span>
          <h2>Learn</h2>
          <p>Explore educational topics. Sample articles are labelled as unreviewed.</p>
          <Link className="text-link" to="/learn">Explore learning →</Link>
        </section>
        <section className="section-card">
          <span className="journey-symbol">▦</span>
          <h2>Appointments</h2>
          <p>Prepare for appointments and organise questions for your care team.</p>
          <Link className="text-link" to="/appointments">View appointments →</Link>
        </section>
      </div>

      <p className="field-help" style={{ marginTop: 20 }}>
        No health measurements or personalised medical insights are generated on this overview yet.
      </p>
    </div>
  );
}