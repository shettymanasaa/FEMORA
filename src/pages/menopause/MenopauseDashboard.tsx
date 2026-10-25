import JourneyPage from "../../ui/common/JourneyPage";

export default function MenopauseDashboard() {
  return (
    <JourneyPage
      journey="menopause"
      title="Your wellbeing, through change."
      description="Track wellbeing, organise health conversations and explore education for the perimenopause and menopause transition."
      primaryAction={{ label: "Daily check-in", path: "/menopause/check-in" }}
      sections={[
        { title: "Recent check-ins", description: "This area will show saved records when the local data layer is connected." },
        { title: "Patterns over time", description: "Insights will be calculated from actual records, not fabricated data." },
        { title: "Ongoing care", description: "Organise questions and follow-up topics for your healthcare professional." },
        { title: "Health report", description: "Preview a summary of selected records before export." },
      ]}
    />
  );
}