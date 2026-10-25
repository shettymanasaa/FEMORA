import { useState } from "react";
import PageHeader from "../../ui/common/PageHeader";

const items = [
  "Documents and appointment details",
  "Comfort items",
  "Clothing and essentials",
  "Questions for the care team",
  "Transport and contact arrangements",
];

export default function HospitalChecklistPage() {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));

  function toggle(index: number) {
    setChecked((current) =>
      current.map((value, i) => (i === index ? !value : value)),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="MATERNITY PREPARATION"
        title="Hospital checklist"
        description="A general organisational checklist to customise with your care team. It is not a medical recommendation."
      />

      <section className="section-card">
        <p>{checked.filter(Boolean).length} of {items.length} items checked</p>
        {items.map((item, index) => (
          <label className="check-row" key={item}>
            <input
              type="checkbox"
              checked={checked[index]}
              onChange={() => toggle(index)}
            />
            <span>{item}</span>
          </label>
        ))}
        <p className="field-help" style={{ marginTop: 16 }}>
          These selections are temporary and will reset when this page reloads.
          Persistent storage will be connected with the shared data module.
        </p>
      </section>
    </div>
  );
}