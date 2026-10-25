import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../ui/common/PageHeader";
import { useAppContext } from "../../app/providers";
import { coreApi } from "../../data/public";

const DEFAULT_ITEMS = [
  "Hospital identification, health insurance, and prenatal medical records",
  "Birth plan copies (printed for delivery team)",
  "Comfortable loose clothing, nursing bras, and warm socks",
  "Toiletries, lip balm, hair ties, and perineal comfort pads",
  "Phone chargers with extra-long cables",
  "Infant going-home outfit, swaddles, and weather layers",
  "Properly installed rear-facing infant car seat (mandatory for discharge)",
  "Snacks, hydration electrolytes, and playlist/headphones",
  "Emergency contact numbers and pediatrician contact details",
];

export default function HospitalChecklistPage() {
  const { activeProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";

  const storageKey = `femora.hospital-checklist.v1.${profileId}`;

  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems));
    } catch {
      // Ignore quota issues
    }
  }, [checkedItems, storageKey]);

  function toggle(item: string) {
    const updated = !checkedItems[item];
    setCheckedItems((current) => ({ ...current, [item]: updated }));

    if (profileId && updated) {
      coreApi.addHospitalChecklistItem(profileId, {
        label: item,
        completed: updated,
      }).catch(() => {});
    }
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const clean = newItemText.trim();
    if (!clean) return;
    if (!items.includes(clean)) {
      setItems((current) => [...current, clean]);
    }
    setNewItemText("");
  }

  const completedCount = items.filter((item) => checkedItems[item]).length;

  return (
    <main>
      <PageHeader
        eyebrow="MATERNITY PREPARATION"
        title="Hospital Bag &amp; Logistics Checklist"
        description="A practical packing checklist to prepare for labor and postpartum hospital stay. Persisted securely on this device."
        action={
          <Link className="button button-secondary" to="/maternity">
            ← Maternity Dashboard
          </Link>
        }
      />

      <section className="section-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>
            Packing Progress ({completedCount} of {items.length} items ready)
          </h2>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4a6741" }}>
            {Math.round((completedCount / (items.length || 1)) * 100)}% Complete
          </span>
        </div>

        <div style={{ height: 8, borderRadius: 4, background: "#e8ede6", overflow: "hidden", marginBottom: 16 }}>
          <div
            style={{
              height: "100%",
              width: `${(completedCount / (items.length || 1)) * 100}%`,
              background: "#4a6741",
              transition: "width 0.2s ease",
            }}
          />
        </div>

        <div className="list-stack" style={{ gap: 8 }}>
          {items.map((item) => {
            const isDone = !!checkedItems[item];
            return (
              <label
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: isDone ? "1px solid #c4d8be" : "1px solid var(--border, #e5eae3)",
                  background: isDone ? "#f5f9f3" : "var(--surface, #fff)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(item)}
                />
                <span style={{ fontSize: "0.9rem", textDecoration: isDone ? "line-through" : "none", color: isDone ? "#555" : "inherit" }}>
                  {item}
                </span>
              </label>
            );
          })}
        </div>

        {/* Add custom item */}
        <form onSubmit={handleAddItem} style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add another packing item..."
            maxLength={200}
            style={{ flex: 1 }}
          />
          <button type="submit" className="button button-secondary">
            ＋ Add Item
          </button>
        </form>
      </section>
    </main>
  );
}
