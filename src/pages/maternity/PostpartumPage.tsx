import JourneyPage from "../../ui/common/JourneyPage";

export default function PostpartumPage() {
  return (
    <JourneyPage
      journey="maternity"
      title="Postpartum recovery"
      description="A space for postpartum notes and preparation for conversations with your care team."
      sections={[
        { title: "Wellbeing notes", description: "Record recovery notes and questions you may want to discuss at a follow-up." },
        { title: "Follow-up care", description: "Appointment and care information should be linked to this profile." },
        { title: "Previous maternity history", description: "Changing to postpartum care must not delete the earlier pregnancy records." },
      ]}
    />
  );
}