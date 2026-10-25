import { Link } from "react-router-dom";
import PageHeader from "../ui/common/PageHeader";

export default function PrivacySettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="YOUR CHOICES"
        title="Privacy settings"
        description="Manage your local information and understand how it is stored."
      />

      <div className="grid grid-2">
        <section className="section-card">
          <h2>Local profile storage</h2>
          <p>
            Your profile and records are stored in this browser on this device.
            Browser storage is not the same as encrypted storage, so protect
            access to your device and browser profile.
          </p>
          <span className="tag">This device</span>
        </section>
        <section className="section-card">
          <h2>AI explanations</h2>
          <p>
            When an AI-assisted feature is available, review its information
            notice and consent options before sending information to an external
            service.
          </p>
          <span className="tag">Consent first</span>
        </section>
        <section className="section-card">
          <h2>Data export and deletion</h2>
          <p>
            Use profile controls to manage local records. Export important
            information before clearing browser data or moving to another
            device; keep exported files somewhere private.
          </p>
          <span className="tag">Manage your records</span>
        </section>
        <section className="section-card">
          <h2>Read the policy</h2>
          <p>Review how FEMORA handles local information and sharing.</p>
          <Link className="button button-primary" to="/legal/privacy">
            Privacy Policy
          </Link>
        </section>
      </div>
    </div>
  );
}