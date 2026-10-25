
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { JOURNEYS } from "../lib/constants";
import { journeyHome } from "../lib/routes";
import { useAppContext } from "../app/providers";
import type { Journey } from "../types";
import PageHeader from "../ui/common/PageHeader";

const journeyImages: Record<Journey, string> = {
  menstrual: "/assets/illustrations/journey-menstrual.png",
  maternity: "/assets/illustrations/journey-maternity.png",
  menopause: "/assets/illustrations/journey-menopause.png",
};

export default function JourneySelectPage() {
  const { activeProfile, updateProfileJourney } = useAppContext();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Journey | null>(
    activeProfile?.journey ?? null,
  );

  useEffect(() => {
    setSelected(activeProfile?.journey ?? null);
  }, [activeProfile?.id, activeProfile?.journey]);

  function confirmJourney() {
    if (!selected || !activeProfile) return;

    if (
      activeProfile.journey &&
      activeProfile.journey !== selected &&
      !window.confirm(
        "Change this profile's active journey? Existing records should remain associated with their original journey.",
      )
    ) {
      return;
    }

    const success = updateProfileJourney(activeProfile.id, selected);

    if (!success) {
      window.alert("The journey could not be saved. Please try again.");
      return;
    }

    navigate(journeyHome(selected), { replace: true });
  }

  return (
    <div>
      <PageHeader
        eyebrow="YOUR JOURNEY"
        title="What would you like support with?"
        description="Choose the journey that fits your needs right now. You can switch later."
      />

      <div className="grid grid-3">
        {JOURNEYS.map((journey) => (
          <button
            className={`journey-card${
              selected === journey.id ? " journey-card-selected" : ""
            }`}
            type="button"
            key={journey.id}
            aria-pressed={selected === journey.id}
            onClick={() => setSelected(journey.id)}
          >
            <span className="journey-card-image-frame">
              <img
                className="journey-card-illustration"
                src={journeyImages[journey.id]}
                alt=""
                loading="lazy"
              />
            </span>

            <h2>{journey.title}</h2>
            <strong>{journey.subtitle}</strong>
            <p>{journey.description}</p>

            <span className="journey-choice">
              {selected === journey.id ? "✓ Selected" : "Select journey"}
            </span>
          </button>
        ))}
      </div>

      <p className="journey-note">
        Choose what feels most relevant today. You can change your journey later.
        Existing records should be retained.
      </p>

      <div className="button-row" style={{ marginTop: 24 }}>
        <button
          className="button button-primary"
          type="button"
          onClick={confirmJourney}
          disabled={!selected || !activeProfile}
        >
          Continue to my journey →
        </button>
      </div>
    </div>
  );
}
