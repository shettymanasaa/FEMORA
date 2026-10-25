import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function ProfilePickerPage() {
  const { profiles, selectProfile, deleteProfile } = useAppContext();
  const navigate = useNavigate();

  function openProfile(profileId: string) {
    selectProfile(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (profile?.journey) {
      navigate(`/${profile.journey}`);
    } else {
      navigate("/home");
    }
  }

  return (
    <main className="standalone-page">
      <div className="standalone-brand">
        <Link className="brand" to="/">
          <img
            className="brand-logo"
            src="/assets/logo/femora-mark.png"
            alt="FEMORA"
          />
          <span>
            <strong>FEMORA</strong>
            <small>Care for every phase of her life.</small>
          </span>
        </Link>
      </div>

      <div className="standalone-content">
        <PageHeader
          eyebrow="PROFILE SOCKET • ONLY PROFILE REQUIRED"
          title="Who is entering FEMORA today?"
          description="Select your profile to continue, or create a new profile. No password or email required."
          action={
            <Link className="button button-primary" to="/profiles/new">
              ＋ Create Profile
            </Link>
          }
        />

        {/* ============================================================= */}
        {/* Local Profile List                                            */}
        {/* ============================================================= */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Your Profiles ({profiles.length})</h2>
          <Link to="/profiles/new" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            ＋ Add another profile
          </Link>
        </div>

        {profiles.length === 0 ? (
          <section className="section-card empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ♡
            </span>
            <h3>No profiles created yet</h3>
            <p>
              Create a local profile to begin tracking. Only a nickname and journey are required.
            </p>
            <Link className="button button-primary" to="/profiles/new">
              + Create profile
            </Link>
          </section>
        ) : (
          <div className="list-stack">
            {profiles.map((profile) => (
              <article className="profile-card" key={profile.id}>
                <span
                  className="avatar"
                  style={{ backgroundColor: profile.avatarColor || "#C77D88" }}
                  aria-hidden="true"
                >
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>

                <div className="list-row-content">
                  <h3 style={{ margin: "0 0 4px 0" }}>{profile.nickname}</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted-foreground, #666)" }}>
                    {profile.journey
                      ? `Active Journey: ${profile.journey.toUpperCase()}`
                      : "Choose a journey to get started"}
                    {profile.isSample ? " · Sample Persona" : ""}
                  </p>
                </div>

                <div className="profile-card-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => openProfile(profile.id)}
                  >
                    Open →
                  </button>

                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}

            <div className="button-row" style={{ marginTop: 16 }}>
              <Link className="button button-primary" to="/profiles/new">
                + Create another profile
              </Link>
            </div>
          </div>
        )}

        <div className="notice notice-sage" style={{ marginTop: 28 }}>
          <strong>Privacy &amp; Local Storage:</strong>
          <p>
            All profiles, check-in logs, and health documents are stored on-device in your browser&apos;s IndexedDB. No external account or remote password is required.
          </p>
        </div>
      </div>
    </main>
  );
}
