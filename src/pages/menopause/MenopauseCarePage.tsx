import JourneyPage from "../../ui/common/JourneyPage";

export default function MenopauseCarePage() {
  return (
    <JourneyPage
      journey="menopause"
      title="Ongoing care"
      description="Keep track of questions and topics to discuss with a qualified healthcare professional."
      sections={[
        { title: "Questions for your care team", description: "A persistent notes form will be added when the approved records contract is connected." },
        { title: "Care history", description: "Care history should be based on records you have chosen to save." },
      ]}
    />
  );
}