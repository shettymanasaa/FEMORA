import JourneyPage from "../../ui/common/JourneyPage";

export default function MenopauseCheckInPage() {
  return (
    <JourneyPage
      journey="menopause"
      title="Your daily check-in"
      description="Record wellbeing information when the local health module is connected."
      sections={[
        { title: "Symptoms and wellbeing", description: "Validated symptom fields will come from the shared health contract." },
        { title: "Safety guidance", description: "Reviewed on-device rules must run before optional AI explanations." },
      ]}
    />
  );
}