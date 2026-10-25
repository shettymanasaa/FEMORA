
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";

export default function TermsPage() {
  return (
    <main className="standalone-page legal-page">
      <div className="standalone-brand">
        <Link className="brand" to="/">
          <img className="brand-logo" src="/assets/logo/femora-mark.png" alt="" width={44} height={44} />
          <span><strong>FEMORA</strong><small>Care for every phase of her life.</small></span>
        </Link>
      </div>

      <article className="standalone-content legal-content">
        <PageHeader
          eyebrow="USING FEMORA"
          title="Terms of Use"
          description="Guidance for using FEMORA thoughtfully and safely."
        />

        <h2>1. Purpose</h2>
        <p>FEMORA supports personal health tracking, general health education and preparation for healthcare conversations.</p>

        <h2>2. Not medical advice</h2>
        <p>FEMORA does not diagnose, treat or cure any condition and is not a substitute for professional medical advice, diagnosis or treatment. Consult a qualified healthcare professional about your circumstances.</p>

        <h2>3. Emergencies</h2>
        <p>Do not use FEMORA to decide whether an emergency is safe to ignore. Seek urgent local medical help when you believe you may need it.</p>

        <h2>4. Your records</h2>
        <p>FEMORA keeps profile information and records in the browser on this device. Browser storage may be lost if site data is cleared or the device is changed. Keep a separate copy of important information and export records before clearing browser data when export is available. Access to the device or browser profile may allow another person to view locally stored information.</p>

        <h2>5. Your responsibility</h2>
        <p>Use FEMORA thoughtfully, review the information you record, and do not enter information you are not comfortable storing in the current browser environment.</p>

        <h2>6. Intellectual property</h2>
        <p>FEMORA's original project materials are subject to the rights of their respective owners. Do not copy or redistribute third-party material without the necessary permission.</p>

        <h2>7. Availability and changes</h2>
        <p>Features may change during development. Continuous availability, accuracy or suitability is not guaranteed.</p>

        <h2>8. Respectful use</h2>
        <p>Use FEMORA for your own wellbeing records and learning. Respect the privacy of other people and do not enter another person's health information without appropriate permission.</p>

        <div className="button-row" style={{ marginTop: 30 }}>
          <Link className="button button-secondary" to="/">Back to welcome</Link>
          <Link className="button button-primary" to="/legal/privacy">Privacy Policy</Link>
        </div>
      </article>
    </main>
  );
}
