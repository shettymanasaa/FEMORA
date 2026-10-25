import { Link } from "react-router-dom";
import type { Journey } from "../../types";
import PageHeader from "./PageHeader";
import SectionCard from "./SectionCard";

interface JourneyPageProps {
  journey: Journey;
  title: string;
  description: string;
  primaryAction?: { label: string; path: string };
  sections?: { title: string; description: string }[];
}

export default function JourneyPage({
  journey,
  title,
  description,
  primaryAction,
  sections = [],
}: JourneyPageProps) {
  const journeyLabel = {
    menstrual: "Menstrual health",
    maternity: "Maternity",
    menopause: "Perimenopause & menopause",
  }[journey];

  return (
    <div>
      <PageHeader
        eyebrow={journeyLabel}
        title={title}
        description={description}
        action={
          primaryAction ? (
            <Link className="button button-primary" to={primaryAction.path}>
              {primaryAction.label}
            </Link>
          ) : undefined
        }
      />

      <div className="journey-banner">
        <img src={`/assets/illustrations/journey-${journey}.png`} alt="" />
        <div>
          <span className="eyebrow">YOUR WELLBEING, YOUR WAY</span>
          <h2>{journeyLabel}, centred on you</h2>
          <p>Keep your notes, check-ins and questions together so you can reflect on changes over time.</p>
        </div>
      </div>

      <div className="grid grid-2">
        {sections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            description={section.description}
          />

        ))}
      </div>
    </div>
  );
}