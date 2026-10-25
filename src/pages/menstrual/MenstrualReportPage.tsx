import JourneyPage from "../../ui/common/JourneyPage";

export default function MenstrualReportPage() {
  return (
    <JourneyPage
      journey="menstrual"
      title="Your menstrual health report"
      description="Review your selected health history before generating or exporting a report."
      sections={[
        { title: "Choose a reporting period", description: "Date filters will be connected to the report contract." },
        { title: "Report preview", description: "The report must be previewed before the user chooses to download or share it." },
      ]}
    />
  );
}