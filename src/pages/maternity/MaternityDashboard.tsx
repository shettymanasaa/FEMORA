import JourneyPage from "../../ui/common/JourneyPage";

export default function MaternityDashboard() {
  return (
    <JourneyPage
      journey="maternity"
      title="Your maternity journey."
      description="Organise pregnancy wellbeing, care preparation and postpartum information in one place."
      primaryAction={{ label: "Daily check-in", path: "/maternity/check-in" }}
      sections={[
        { title: "Pregnancy overview", description: "Pregnancy details and any calculated estimates require saved profile data." },
        { title: "Upcoming appointments", description: "Appointments will be shown from the local appointment module." },
        { title: "Birth preparation", description: "Continue to your birth plan and hospital checklist." },
        { title: "Postpartum care", description: "Postpartum records should remain linked to the original maternity journey." },
      ]}
    />
  );
}