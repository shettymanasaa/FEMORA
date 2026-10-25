import JourneyPage from "../../ui/common/JourneyPage";

export default function MenopauseInsightsPage() {
  return (
    <JourneyPage
      journey="menopause"
      title="Your wellbeing insights"
      description="Review patterns in recorded symptoms over time without treating them as a diagnosis."
      primaryAction={{ label: "View report", path: "/menopause/report" }}
      sections={[
        { title: "Symptom patterns", description: "Visualisations require actual local records and will not invent values." },
        { title: "Topics to discuss", description: "Educational suggestions should be clearly separated from medical advice." },
      ]}
    />
  );
}