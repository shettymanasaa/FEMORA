import JourneyPage from "../../ui/common/JourneyPage";

export default function MaternityCheckInPage() {
  return (
    <JourneyPage
      journey="maternity"
      title="Your maternity check-in"
      description="Record wellbeing information only after the reviewed health and safety contracts are connected."
      sections={[
        { title: "Symptoms and wellbeing", description: "Form fields and local validation will be supplied by the health contract." },
        { title: "Safety information", description: "Clinically reviewed safety guidance must be available independently of AI." },
      ]}
    />
  );
}