import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/providers";
import PageHeader from "../ui/common/PageHeader";

type IntakeAnswers = {
  dateOfBirth: string;
  periodStatus: string;
  periodDate: string;
  usualCycleLength: string;
  foodPreference: string;
  acne: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  maritalStatus: string;
  allergies: string;
  healthConditions: string;
  sexualActivity: string;
  workStrain: string;
  sleepQuality: string;
  hotFlashes: string;
  mood: string;
};

const initialAnswers: IntakeAnswers = {
  dateOfBirth: "",
  periodStatus: "",
  periodDate: "",
  usualCycleLength: "28",
  foodPreference: "",
  acne: "",
  height: "",
  heightUnit: "cm",
  weight: "",
  weightUnit: "kg",
  maritalStatus: "",
  allergies: "",
  healthConditions: "",
  sexualActivity: "",
  workStrain: "",
  sleepQuality: "",
  hotFlashes: "",
  mood: "",
};

const guideCards = [
  {
    number: "01",
    title: "Welcome to FEMORA",
    description:
      "A personal space for health tracking, reflection and education across different life stages.",
    symbol: "✿",
  },
  {
    number: "02",
    title: "Track your wellbeing",
    description:
      "Record check-ins and notes at your own pace. Share only what you are comfortable recording.",
    symbol: "♡",
  },
  {
  number: "03",
  title: "Understand patterns",
  description:
    "Review changes over time and prepare useful questions for your healthcare professional.",
  symbol: "◒",
},
{
  number: "04",
  title: "Your reports and privacy",
  description:
    "Choose the information you want to keep in your records and include in your health summary.",
  symbol: "⌂",
},
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function OnboardingPage() {
  const { activeProfile } = useAppContext();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"guide" | "intake">("guide");
  const [guideIndex, setGuideIndex] = useState(0);
  const [answers, setAnswers] =
    useState<IntakeAnswers>(initialAnswers);
  const [error, setError] = useState("");

  function update<K extends keyof IntakeAnswers>(
    key: K,
    value: IntakeAnswers[K],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function skipGuide() {
    setStage("intake");
  }

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProfile) {
      navigate("/profiles");
      return;
    }

    if (!answers.dateOfBirth) {
      setError("Enter your date of birth to continue.");
      return;
    }

    const birthDate = new Date(`${answers.dateOfBirth}T00:00:00`);
    const today = new Date(`${todayString()}T00:00:00`);

    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate > today
    ) {
      setError("Enter a valid date of birth that is not in the future.");
      return;
    }

    if (!answers.periodStatus) {
      setError("Choose an option for your menstrual period.");
      return;
    }

    if (answers.periodStatus === "yes" && !answers.periodDate) {
      setError("Enter the first day of your last period, or choose another period-status option if it does not apply.");
      return;
    }

    if (answers.periodDate && answers.periodDate > todayString()) {
      setError("The last period date cannot be in the future.");
      return;
    }

    const cycleLength = Number(answers.usualCycleLength);
    if (
      answers.periodStatus === "yes" &&
      (!Number.isInteger(cycleLength) ||
        cycleLength < 21 ||
        cycleLength > 45)
    ) {
      setError("Enter a usual cycle length between 21 and 45 days.");
      return;
    }

    try {
      const payload = {
        ...answers,
        ageEligibility: "calculated-from-date-of-birth",
        completedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        `femora.intake.v1.${activeProfile.id}`,
        JSON.stringify(payload),
      );

      navigate("/select-journey");
    } catch {
      setError(
        "Your answers could not be saved in this browser. Check available storage and try again.",
      );
    }
  }

  if (!activeProfile) {
    return (
      <section className="section-card">
        <h1>Choose a profile first</h1>
        <p>Create or select a profile before continuing.</p>
        <button
          className="button button-primary"
          type="button"
          onClick={() => navigate("/profiles")}
        >
          Go to profiles
        </button>
      </section>
    );
  }

  if (stage === "guide") {
    const card = guideCards[guideIndex];

    return (
      <section className="onboarding-flow">
        <PageHeader
          eyebrow="YOUR FEMORA GUIDE"
          title={`Welcome, ${activeProfile.nickname}.`}
          description="A quick introduction before you personalise your space."
        />

        <article className="section-card guide-card">
          <div className="guide-card-top">
            <span className="guide-symbol" aria-hidden="true">
              {card.symbol}
            </span>
            <span className="guide-counter">
              {guideIndex + 1} of {guideCards.length}
            </span>
          </div>

          <p className="eyebrow">YOUR GUIDE</p>
          <h2>{card.title}</h2>
          <p className="guide-description">{card.description}</p>

          <div
            className="guide-progress"
            aria-label={`Step ${guideIndex + 1} of ${guideCards.length}`}
          >
            {guideCards.map((item, index) => (
              <span
                key={item.number}
                className={`guide-dot${index === guideIndex ? " active" : ""}`}
              />
            ))}
          </div>

          <div className="button-row guide-actions">
            <button
              className="button button-secondary"
              type="button"
              disabled={guideIndex === 0}
              onClick={() =>
                setGuideIndex((index) => Math.max(0, index - 1))
              }
            >
              Back
            </button>

            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                if (guideIndex === guideCards.length - 1) {
                  skipGuide();
                } else {
                  setGuideIndex((index) => index + 1);
                }
              }}
            >
              {guideIndex === guideCards.length - 1
                ? "Get started"
                : "Next"}
            </button>
          </div>
        </article>

        <div className="guide-skip-row">
          <button
            className="text-button"
            type="button"
            onClick={skipGuide}
          >
            Skip guide
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="onboarding-flow">
      <PageHeader
        eyebrow="LET'S PERSONALISE YOUR SPACE"
        title="A few things about you"
        description="Answer what you feel comfortable sharing. Sensitive questions are optional unless marked otherwise."
      />

      <form className="section-card intake-form" onSubmit={submitIntake}>
        <h2>About you</h2>
        <p className="field-help">
          Your date of birth is used to calculate age eligibility for
          age-restricted features. It is not a diagnosis or a health
          assessment.
        </p>

        <div className="field">
          <label htmlFor="dateOfBirth">Date of birth</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={answers.dateOfBirth}
            max={todayString()}
            onChange={(event) =>
              update("dateOfBirth", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label htmlFor="periodStatus">
            Have you had a menstrual period?
          </label>
          <select
            id="periodStatus"
            value={answers.periodStatus}
            onChange={(event) => {
              const value = event.target.value;
              update("periodStatus", value);
              if (value !== "yes") {
                update("periodDate", "");
              }
            }}
            required
          >
            <option value="">Choose an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="not-applicable">Not applicable</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        {answers.periodStatus === "yes" && (
          <>
            <div className="field">
              <label htmlFor="periodDate">
                First day of your last period
              </label>
              <input
                id="periodDate"
                type="date"
                value={answers.periodDate}
                max={todayString()}
                onChange={(event) =>
                  update("periodDate", event.target.value)
                }
                required
              />
              <p className="field-help">
                This date helps estimate your current cycle phase.
                Cycle predictions can be inaccurate, especially when
                cycles are irregular.
              </p>
            </div>

            <div className="field">
              <label htmlFor="usualCycleLength">
                Usual cycle length (days)
              </label>
              <input
                id="usualCycleLength"
                type="number"
                min={21}
                max={45}
                step={1}
                value={answers.usualCycleLength}
                onChange={(event) =>
                  update("usualCycleLength", event.target.value)
                }
                required
              />
              <p className="field-help">
                If you are unsure, you can leave the default estimate
                and update it later.
              </p>
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="foodPreference">Food preference</label>
          <select
            id="foodPreference"
            value={answers.foodPreference}
            onChange={(event) =>
              update("foodPreference", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="non-vegetarian">Non-vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="other">Other</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="acne">Have you noticed acne recently?</label>
          <select
            id="acne"
            value={answers.acne}
            onChange={(event) => update("acne", event.target.value)}
          >
            <option value="">Choose an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="sometimes">Sometimes</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        <div className="form-grid-two">
          <div className="field">
            <label htmlFor="height">Height (optional)</label>
            <div className="input-with-unit">
              <input
                id="height"
                type="number"
                min="0"
                max="300"
                step="any"
                value={answers.height}
                onChange={(event) =>
                  update("height", event.target.value)
                }
                placeholder="Height"
              />
              <select
                aria-label="Height unit"
                value={answers.heightUnit}
                onChange={(event) =>
                  update("heightUnit", event.target.value)
                }
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="weight">Weight (optional)</label>
            <div className="input-with-unit">
              <input
                id="weight"
                type="number"
                min="0"
                max="500"
                step="any"
                value={answers.weight}
                onChange={(event) =>
                  update("weight", event.target.value)
                }
                placeholder="Weight"
              />
              <select
                aria-label="Weight unit"
                value={answers.weightUnit}
                onChange={(event) =>
                  update("weightUnit", event.target.value)
                }
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="maritalStatus">Marital status (optional)</label>
          <select
            id="maritalStatus"
            value={answers.maritalStatus}
            onChange={(event) =>
              update("maritalStatus", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="partnered">Partnered</option>
            <option value="other">Other</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="allergies">Allergies (optional)</label>
          <textarea
            id="allergies"
            rows={2}
            value={answers.allergies}
            onChange={(event) =>
              update("allergies", event.target.value)
            }
            placeholder="Anything you want to record"
          />
        </div>

        <div className="field">
          <label htmlFor="healthConditions">
            Existing health conditions or notes (optional)
          </label>
          <textarea
            id="healthConditions"
            rows={3}
            value={answers.healthConditions}
            onChange={(event) =>
              update("healthConditions", event.target.value)
            }
            placeholder="Add any notes you want to keep"
          />
        </div>

        <div className="field">
          <label htmlFor="sexualActivity">
            Sexual activity (optional)
          </label>
          <select
            id="sexualActivity"
            value={answers.sexualActivity}
            onChange={(event) =>
              update("sexualActivity", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
          <p className="field-help">
            This is optional. Your answer does not determine which
            health journey you can choose.
          </p>
        </div>

        <div className="field">
          <label htmlFor="workStrain">
            How demanding is your daily routine?
          </label>
          <select
            id="workStrain"
            value={answers.workStrain}
            onChange={(event) =>
              update("workStrain", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="low">Less demanding</option>
            <option value="moderate">Moderately demanding</option>
            <option value="high">Very demanding</option>
            <option value="variable">It varies</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        <hr />

        <h2>Everyday wellbeing</h2>
        <p className="field-help">
          These answers are optional and help you record how you have
          been feeling. They do not identify a medical condition.
        </p>

        <div className="field">
          <label htmlFor="sleepQuality">
            How has your sleep been lately?
          </label>
          <select
            id="sleepQuality"
            value={answers.sleepQuality}
            onChange={(event) =>
              update("sleepQuality", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="good">Good — mostly restful</option>
            <option value="mixed">Mixed — some good, some difficult nights</option>
            <option value="poor">Poor — often difficult</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="hotFlashes">
            Have you experienced hot flashes or night sweats?
          </label>
          <select
            id="hotFlashes"
            value={answers.hotFlashes}
            onChange={(event) =>
              update("hotFlashes", event.target.value)
            }
          >
            <option value="">Choose an option</option>
            <option value="never">Never</option>
            <option value="sometimes">Sometimes</option>
            <option value="often">Often</option>
            <option value="unsure">Not sure</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
          <p className="field-help">
            This question is for tracking only. Hot flashes can occur
            for different reasons and are not used here to diagnose
            menopause.
          </p>
        </div>

        <div className="field">
          <label htmlFor="mood">How has your mood been lately?</label>
          <select
            id="mood"
            value={answers.mood}
            onChange={(event) => update("mood", event.target.value)}
          >
            <option value="">Choose an option</option>
            <option value="good">Mostly good</option>
            <option value="okay">Up and down</option>
            <option value="low">Low</option>
            <option value="anxious">Anxious or stressed</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <div className="notice notice-sage">
           Your answers help personalise your FEMORA experience. You can
  leave optional fields blank.
        </div>

        <div className="button-row" style={{ marginTop: 22 }}>
          <button className="button button-primary" type="submit">
            Save and choose a journey →
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setStage("guide")}
          >
            Back to guide
          </button>
        </div>
      </form>
    </div>
  );
}