import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

export default function ProfileCreatePage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [enablePin, setEnablePin] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { createProfile } = useAppContext();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanNickname = nickname.trim();

    if (!cleanNickname) {
      setError("Enter a nickname to create your profile.");
      return;
    }

    if (cleanNickname.length > 32) {
      setError("Your nickname must be 32 characters or fewer.");
      return;
    }

    if (enablePin) {
      if (!/^\d{4,6}$/.test(pin)) {
        setError("Choose a PIN with 4 to 6 digits.");
        return;
      }

      if (pin !== confirmPin) {
        setError("The PIN entries do not match.");
        return;
      }

      setError(
        "PIN protection is not connected to the Core Engine yet. Your PIN has not been saved or activated. Turn off PIN setup to create this profile.",
      );
      return;
    }

    const profile = createProfile(cleanNickname);

    if (!profile) {
      setError("The profile could not be created. Please try again.");
      return;
    }

    navigate("/onboarding");
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
          eyebrow="A SPACE THAT IS YOURS"
          title="Create your profile"
          description="Choose a nickname. You do not need to enter your full legal name."
        />

        <form className="section-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              name="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setError("");
              }}
              maxLength={32}
              autoComplete="off"
              placeholder="What should we call this profile?"
              required
            />
            <p className="field-help">
              Use a nickname that you can recognise. Your date of
              birth will be asked with the other intake questions,
              not here.
            </p>
          </div>

          <section className="pin-setup">
            <label className="pin-toggle">
              <input
                type="checkbox"
                checked={enablePin}
                onChange={(event) => {
                  setEnablePin(event.target.checked);
                  setError("");
                  setPin("");
                  setConfirmPin("");
                }}
              />
              <span>
                <strong>Set up a profile PIN</strong>
                <small>
                  Optional. PIN protection is not active until the
                  Core Engine security API is connected.
                </small>
              </span>
            </label>

            {enablePin && (
              <div className="form-grid-two pin-fields">
                <div className="field">
                  <label htmlFor="profile-pin">Create PIN</label>
                  <input
                    id="profile-pin"
                    inputMode="numeric"
                    autoComplete="new-password"
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(event) => {
                      setPin(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setError("");
                    }}
                    placeholder="4–6 digits"
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-pin-confirm">Confirm PIN</label>
                  <input
                    id="profile-pin-confirm"
                    inputMode="numeric"
                    autoComplete="new-password"
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(event) => {
                      setConfirmPin(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setError("");
                    }}
                    placeholder="Enter it again"
                  />
                </div>

                <p className="field-help pin-help">
                  Do not rely on this form to protect your health data.
                  This project version does not save or activate the PIN.
                </p>
              </div>
            )}
          </section>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <div className="button-row" style={{ marginTop: 22 }}>
            <button className="button button-primary" type="submit">
              Create profile
            </button>

            <Link className="button button-secondary" to="/profiles">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}