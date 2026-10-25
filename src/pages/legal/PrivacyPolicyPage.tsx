
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";

export default function PrivacyPolicyPage() {
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
          eyebrow="YOUR PRIVACY MATTERS"
          title="Privacy Policy"
          description="How FEMORA handles the information you choose to keep in your personal space."
        />

        <h2>1. Information you enter</h2>
        <p>FEMORA supports personal health tracking, wellbeing education and preparation for conversations with healthcare professionals. The information you enter can include profile details, check-ins, symptoms, appointments, notes and health-related records.</p>

        <h2>2. Local browser storage</h2>
        <p>Profile information and app records are stored in this browser on this device. Browser storage is not the same as encrypted storage. Anyone with access to your device or browser profile may be able to access locally stored information. Keep your device access private and export a backup before clearing browser data or moving to another device.</p>

        <h2>3. AI features</h2>
        <p>If an AI-assisted feature is offered, its screen should explain what information is used and ask for your permission before sharing data with an external service. Do not assume information stays on this device when a feature explicitly uses an external service.</p>

        <h2>4. Health and safety</h2>
        <p>FEMORA is not an emergency service and does not replace a qualified healthcare professional. General educational material is not a diagnosis. Do not delay urgent care because of an app result.</p>

        <h2>5. Profiles and deletion</h2>
        <p>Profiles are local to this browser and are not online accounts. Use the profile controls to manage or delete a profile. Deletion applies to records managed by this installation; it does not delete files or exports you saved separately.</p>

        <h2>6. Sharing and third parties</h2>
        <p>Reports and exports should be reviewed before you share them. You control whether to send or show an exported file to another person. Do not include information you do not want the recipient to see.</p>

        <h2>7. Your choices</h2>
        <p>You can review your profile, manage locally stored information and decide whether to export or share records. For particularly sensitive information, consider who can access your device and browser profile.</p>

        <h2>8. Changes and contact</h2>
        <p>This policy may change as FEMORA evolves. For privacy questions, contact the FEMORA project team through the official channel provided with your installation or distribution.</p>

        <div className="button-row" style={{ marginTop: 30 }}>
          <Link className="button button-secondary" to="/">Back to welcome</Link>
          <Link className="button button-primary" to="/legal/terms">Read terms</Link>
        </div>
      </article>
    </main>
  );
}
