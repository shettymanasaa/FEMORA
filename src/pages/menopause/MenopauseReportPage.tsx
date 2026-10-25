import JourneyPage from "../../ui/common/JourneyPage";

export default function MenopauseReportPage() {
  return (
    <JourneyPage
      journey="menopause"
      title="Your menopause health report"
      description="Choose records to review and prepare a summary for your care team."
      sections={[
        { title: "Choose records and dates", description: "Filters will use the local report contract." },
        { title: "Preview report", description: "Review report contents before downloading or sharing." },
      ]}
    />
  );
}