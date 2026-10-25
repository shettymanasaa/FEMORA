import JourneyPage from "../../ui/common/JourneyPage";

export default function BirthPlanPage() {
  return (
    <JourneyPage
      journey="maternity"
      title="Birth plan"
      description="Organise questions, preferences and discussion points to review with your maternity care team."
      sections={[
        { title: "Preferences and questions", description: "The form will save locally after the approved records interface is connected." },
        { title: "Review your plan", description: "Review and update your plan with your care team as circumstances change." },
      ]}
    />
  );
}