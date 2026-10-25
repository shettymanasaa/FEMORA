
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";

const maternitySections = [
  {
    title: "Pregnancy overview",
    description:
      "View your pregnancy information and organise questions for your maternity care team.",
    links: [
      { label: "Pregnancy check-in", path: "/maternity/check-in" },
      { label: "Appointments", path: "/appointments" },
    ],
  },
  {
    title: "Upcoming appointments",
    description:
      "Open your appointments area to organise visits and care-team questions.",
    links: [
      { label: "View appointments", path: "/appointments" },
    ],
  },
  {
    title: "Birth preparation",
    description:
      "Record your preferences and prepare a checklist for your hospital visit.",
    links: [
      { label: "Open birth plan", path: "/maternity/birth-plan" },
      { label: "Open hospital checklist", path: "/maternity/hospital-checklist" },
    ],
  },
  {
    title: "Postpartum care",
    description:
      "Open your postpartum area to record recovery notes and follow-up questions.",
    links: [
      { label: "Open postpartum care", path: "/maternity/postpartum" },
    ],
  },
];

export default function MaternityDashboard() {
  return (
    <main>
      <PageHeader
        eyebrow="YOUR MATERNITY JOURNEY"
        title="Pregnancy and postpartum care"
        description="Organise your wellbeing, birth preparation, appointments and postpartum notes in one place."
      />

      <section className="section-card" style={{ marginBottom: 20 }}>
        <h2>Daily wellbeing</h2>
        <p>Record how you are feeling during your maternity journey.</p>
        <Link
          className="button button-primary"
          to="/maternity/check-in"
        >
          Open daily check-in
        </Link>
      </section>

      <div className="grid grid-2">
        {maternitySections.map((section) => (
          <section className="section-card" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.description}</p>

            <div className="button-row" style={{ marginTop: 16 }}>
              {section.links.map((link) => (
                <Link
                  className="button button-secondary"
                  to={link.path}
                  key={link.path}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="field-help" style={{ marginTop: 20 }}>
        These tools organise personal information and questions. They do not
        provide a diagnosis or replace care from a qualified healthcare
        professional.
      </p>
    </main>
  );
}
