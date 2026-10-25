
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

  const journeyRoutes: Record<string, string> = {
    menstrual: "/menstrual",
    maternity: "/maternity/dashboard",
    menopause: "/menopause/dashboard",
  };

  const checkInRoutes: Record<string, string> = {
    menstrual: "/menstrual/check-in",
    maternity: "/maternity/check-in",
    menopause: "/menopause/check-in",
  };

  const journeyId = selectedJourney?.id ?? "";
  const journeyRoute = journeyRoutes[journeyId];
  const checkInRoute = checkInRoutes[journeyId];

  return (
    <div>
      <PageHeader
        eyebrow="YOUR OVERVIEW"
        title={`Welcome, ${activeProfile?.nickname ?? "there"}.`}
        description="Your health journey, all in one calm and personal space."
        action={
          <button
            className="button button-secondary"
            type="button"
            onClick={() => navigate("/settings")}
          >
            My profile
          </button>
        }
      />

      {selectedJourney && journeyRoute ? (
        <section className="hero-panel">
          <div>
            <p className="eyebrow">YOUR CURRENT JOURNEY</p>
            <h2>{selectedJourney.title}</h2>
            <p>{selectedJourney.description}</p>
            <div className="home-actions">
              <Link className="button button-primary" to={journeyRoute}>
                Open my journey
              </Link>
              <Link
                className="button button-secondary"
                to="/select-journey"
              >
                Change journey
              </Link>
            </div>
          </div>

          <div className="hero-panel-symbol" aria-hidden="true">
            {selectedJourney.symbol}
          </div>
        </section>
      ) : (
        <section className="section-card">
          <p className="eyebrow">YOUR NEXT STEP</p>
          <h2>Choose your health journey</h2>
          <p>
            Select the journey that fits your needs to find relevant
            check-ins and resources.
          </p>
          <Link className="button button-primary" to="/select-journey">
            Choose my journey
          </Link>
        </section>
      )}

      <section aria-labelledby="quick-actions-title">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">PICK UP WHERE YOU NEED</p>
            <h2 id="quick-actions-title">Quick access</h2>
          </div>
        </div>

        <div className="grid grid-3">
          <section className="section-card">
            <span className="journey-symbol" aria-hidden="true">
              +
            </span>
            <h3>Daily check-in</h3>
            <p>
              Record how you feel using the check-in for your selected
              journey.
            </p>
            {checkInRoute ? (
              <Link className="text-link" to={checkInRoute}>
                Open check-in
              </Link>
            ) : (
              <Link className="text-link" to="/select-journey">
                Choose a journey first
              </Link>
            )}
          </section>

          <section className="section-card">
            <span className="journey-symbol" aria-hidden="true">
              i
            </span>
            <h3>Health history</h3>
            <p>
              Visit your health history area to review available records.
            </p>
            <Link className="text-link" to="/profile/health-history">
              View health history
            </Link>
          </section>

          <section className="section-card">
            <span className="journey-symbol" aria-hidden="true">
              *
            </span>
            <h3>Learn</h3>
            <p>
              Explore educational resources. Sample articles may be
              unreviewed.
            </p>
            <Link className="text-link" to="/learn">
              Explore learning
            </Link>
          </section>

          <section className="section-card">
            <span className="journey-symbol" aria-hidden="true">
              +
            </span>
            <h3>Appointments</h3>
            <p>
              Organise appointment details and prepare questions for your
              care team.
            </p>
            <Link className="text-link" to="/appointments">
              View appointments
            </Link>
          </section>

          <section className="section-card">
            <span className="journey-symbol" aria-hidden="true">
              ○
            </span>
            <h3>Profile and privacy</h3>
            <p>
              Access your profile settings and privacy options.
            </p>
            <Link className="text-link" to="/settings">
              Open settings
            </Link>
          </section>
        </div>
      </section>

      <p className="field-help" style={{ marginTop: 20 }}>
        Health records and personalised medical insights depend on the
        available connected features. This overview does not generate
        medical measurements or diagnoses.
      </p>
    </div>
  );
}
