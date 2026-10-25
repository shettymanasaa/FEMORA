import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function ProfilePickerPage() {
  const { profiles, selectProfile, deleteProfile } = useAppContext();
  const navigate = useNavigate();

  function openProfile(profileId: string) {
    selectProfile(profileId);
    navigate("/onboarding");
  }

  return (
    <main className="standalone-page">
      <div className="standalone-brand">
        <Link className="brand" to="/">
          <img
            className="brand-logo"
            src="/assets/logo/femora-mark.png"
            alt=""
          />
          <span>
            <strong>FEMORA</strong>
            <small>Care for every phase of her life.</small>
          </span>
        </Link>
      </div>

      <div className="standalone-content">
        <PageHeader
          eyebrow="YOUR PERSONAL SPACE"
          title="Who is this space for?"
          description="Choose a profile or create a new one. You can use a nickname instead of your legal name."
        />

        {profiles.length === 0 ? (
          <section className="section-card empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              ♡
            </span>
            <h2>Your space starts here</h2>
            <p>
              Create a local profile to begin. 
            </p>
            <Link className="button button-primary" to="/profiles/new">
              Create a profile
            </Link>
          </section>
        ) : (
          <div className="list-stack">
            {profiles.map((profile) => (
              <article className="profile-card" key={profile.id}>
                <span
                  className="avatar"
                  style={{ backgroundColor: profile.avatarColor }}
                  aria-hidden="true"
                >
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>

                <div className="list-row-content">
                  <h3>{profile.nickname}</h3>
                  <p>
                    {profile.journey
                      ? `Journey: ${profile.journey}`
                      : "Choose a journey to get started"}
                  </p>
                </div>

                <div className="profile-card-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() => openProfile(profile.id)}
                  >
                    Open
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

            <Link className="button button-secondary" to="/profiles/new">
              + Add another profile
            </Link>
          </div>
        )}

        <div className="notice notice-sage">
          <strong>About local data</strong>
          <p>
            
          </p>
        </div>
      </div>
    </main>
  );
}
