import JourneyPage from "../../ui/common/JourneyPage";

export default function MaternityReportPage() {
  return (
    <JourneyPage
      journey="maternity"
      title="Your maternity report"
      description="Review selected records and prepare a summary for a healthcare conversation."
      sections={[
        { title: "Select records", description: "Report selection will be connected to the local report contract." },
        { title: "Preview and export", description: "Reports must be previewed and never shared automatically." },
      ]}
    />
  );
}