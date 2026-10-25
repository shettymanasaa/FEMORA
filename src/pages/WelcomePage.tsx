
import { Link } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import { useAppContext } from "../app/providers";

export default function WelcomePage() {
  const { theme, setTheme } = useAppContext();
  const isDark = theme === "dark";

  return (
    <main className="welcome-page botanical-landing">
      <header className="welcome-top botanical-header">
        <Link to="/" className="brand welcome-brand" aria-label="FEMORA home">
          <img
            className="brand-logo"
            src="/assets/logo/femora-mark.png"
            alt="FEMORA botanical logo"
            width={64}
            height={64}
          />
          <span className="welcome-brand-copy">
            <strong>{APP_NAME}</strong>
            <small>{APP_TAGLINE}</small>
          </span>
        </Link>

        <nav className="welcome-nav" aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#journeys">Journeys</a>
          <a href="#features">Features</a>
          <Link to="/legal/privacy">Privacy</Link>
        </nav>

        <div className="welcome-header-actions">
          <button
            type="button"
            className="welcome-theme-toggle"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
            <span className="theme-toggle-label">
              {isDark ? "Light" : "Dark"}
            </span>
          </button>

          <Link className="button button-secondary" to="/legal/privacy">
            Privacy
          </Link>

          <Link className="button button-primary" to="/profiles">
            Get started <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <section className="welcome-hero botanical-hero">
        <div className="welcome-copy">
          <p className="eyebrow">YOUR WELLBEING, YOUR WAY</p>

          <h1>
            <span className="hero-name">{APP_NAME}</span>
            <span>Care that grows with you.</span>
          </h1>

          <p className="welcome-tagline">{APP_TAGLINE}</p>

          <p className="welcome-description">
            A personal space to understand your health, notice patterns and
            prepare for more informed conversations with your care team.
          </p>

          <div className="button-row">
            <Link className="button button-primary" to="/profiles">
              Get started <span aria-hidden="true">→</span>
            </Link>

            <a className="button button-secondary" href="#about">
              Discover FEMORA <span aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="welcome-footnote">
            Create a local profile on this device. Review the privacy
            information to understand current storage limitations.
          </p>
        </div>
      </section>

      <section className="welcome-about botanical-section" id="about">
        <div className="welcome-about-copy">
          <p className="eyebrow">A SPACE THAT GROWS WITH YOU</p>
          <h2>Your health is a journey, not a single moment.</h2>

          <p>
            FEMORA is a personal wellbeing companion designed to help you
            record information, reflect on changes and feel more prepared for
            conversations with healthcare professionals.
          </p>

          <p>
            Your needs can change over time. Bring health tracking, educational
            resources, appointment notes and personal history into one
            thoughtful space, with tools for different stages of life.
          </p>

          <Link className="button button-primary" to="/profiles">
            Find your starting point <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="welcome-art about-art">
          <img
            className="about-illustration"
            src="/assets/illustrations/wellbeing.png"
            alt="Illustration representing personal wellbeing and care"
            loading="lazy"
          />
          <span className="art-caption">A little more in tune with you</span>
        </div>
      </section>

      <section
        className="welcome-features botanical-section"
        id="features"
        aria-label="What FEMORA offers"
      >
        <article>
          <span className="feature-icon" aria-hidden="true">◷</span>
          <h2>Know your patterns</h2>
          <p>
            Keep check-ins and changes together so you can reflect on your
            wellbeing over time.
          </p>
        </article>

        <article>
          <span className="feature-icon" aria-hidden="true">♡</span>
          <h2>Make space for you</h2>
          <p>
            Save personal wellbeing notes and explore educational resources at
            your own pace.
          </p>
        </article>

        <article>
          <span className="feature-icon" aria-hidden="true">✿</span>
          <h2>Feel prepared</h2>
          <p>
            Organise questions, appointments and health summaries for
            conversations with your care team.
          </p>
        </article>
      </section>

      <section className="welcome-journeys botanical-section" id="journeys">
        <div className="section-heading">
          <p className="eyebrow">CARE FOR EVERY PHASE</p>
          <h2>Support that meets you where you are.</h2>
          <p>
            Explore the journey that fits your needs. You can review your
            choices as your circumstances change.
          </p>
        </div>

        <div className="journey-preview-grid">
          <article className="journey-preview-card">
            <img
              src="/assets/illustrations/journey-menstrual.png"
              alt=""
              loading="lazy"
            />
            <h3>Menstrual health</h3>
            <p>Notice cycle patterns, log symptoms and reflect on wellbeing.</p>
          </article>

          <article className="journey-preview-card">
            <img
              src="/assets/illustrations/journey-maternity.png"
              alt=""
              loading="lazy"
            />
            <h3>Maternity &amp; postpartum</h3>
            <p>Organise check-ins, birth preparation and recovery notes.</p>
          </article>

          <article className="journey-preview-card">
            <img
              src="/assets/illustrations/journey-menopause.png"
              alt=""
              loading="lazy"
            />
            <h3>Perimenopause &amp; menopause</h3>
            <p>Track changes, save questions and explore helpful information.</p>
          </article>
        </div>

        <Link className="button button-primary" to="/profiles">
          Choose your starting point <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="welcome-privacy botanical-section">
        <div>
          <p className="eyebrow">YOUR SPACE, YOUR CHOICES</p>
          <h2>Your health story belongs to you.</h2>
          <p>
            Review your privacy options, manage your local profile and
            understand how your information is handled.
          </p>
        </div>

        <Link className="button button-secondary" to="/legal/privacy">
          Explore privacy
        </Link>
      </section>

      <footer className="welcome-footer botanical-footer">
        <span>© {new Date().getFullYear()} FEMORA</span>
        <span>
          <Link to="/legal/privacy">Privacy Policy</Link>
          {" · "}
          <Link to="/legal/terms">Terms</Link>
        </span>
      </footer>
    </main>
  );
}
