
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function ProfilePickerPage() {
  const {
    profiles,
    selectProfile,
    deleteProfile,
    updateProfileNickname,
  } = useAppContext();

  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  function openProfile(profileId: string) {
    selectProfile(profileId);
    navigate("/onboarding");
  }

  function startEditing(profileId: string, currentNickname: string) {
    setEditingId(profileId);
    setNickname(currentNickname);
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setNickname("");
    setMessage("");
  }

  function saveNickname(profileId: string) {
    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setMessage("Enter a profile name before saving.");
      return;
    }

    if (cleanNickname.length > 32) {
      setMessage("Profile names must be 32 characters or fewer.");
      return;
    }

    const saved = updateProfileNickname(profileId, cleanNickname);

    if (!saved) {
      setMessage("Could not update this profile. Please try again.");
      return;
    }

    setEditingId(null);
    setNickname("");
    setMessage("");
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
            <p>Create a local profile to begin.</p>
            <Link className="button button-primary" to="/profiles/new">
              Create a profile
            </Link>
          </section>
        ) : (
          <div className="list-stack">
            {profiles.map((profile) => (
              <article
  className={`profile-card${editingId === profile.id ? " profile-card-editing" : ""}`}
  key={profile.id}
>
                <span
                  className="avatar"
                  style={{ backgroundColor: profile.avatarColor }}
                  aria-hidden="true"
                >
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>

                <div className="list-row-content">
                  {editingId === profile.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveNickname(profile.id);
                      }}
                    >
                      <label htmlFor={`nickname-${profile.id}`}>
                        Profile name
                      </label>
                      <input
                        id={`nickname-${profile.id}`}
                        type="text"
                        value={nickname}
                        onChange={(event) => {
                          setNickname(event.target.value);
                          setMessage("");
                        }}
                        maxLength={32}
                        autoFocus
                        required
                      />
                      <p className="field-help">
                        Use a nickname or any name you prefer.
                      </p>

                      {message && (
                        <p role="alert" className="field-help">
                          {message}
                        </p>
                      )}

                      <div className="profile-card-actions">
                        <button
                          className="button button-primary"
                          type="submit"
                        >
                          Save name
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{profile.nickname}</h3>
                      <p>
                        {profile.journey
                          ? `Journey: ${profile.journey}`
                          : "Choose a journey to get started"}
                      </p>
                    </>
                  )}
                </div>

                {editingId !== profile.id && (
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
                      onClick={() =>
                        startEditing(profile.id, profile.nickname)
                      }
                    >
                      Edit name
                    </button>

                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => deleteProfile(profile.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
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
            Profiles and related information are stored locally in this
            browser on this device.
          </p>
        </div>
      </div>
    </main>
  );
}
