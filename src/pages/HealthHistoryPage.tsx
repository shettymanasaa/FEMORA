import PageHeader from "../ui/common/PageHeader";

export default function HealthHistoryPage() {
  return (
    <div>
      <PageHeader
        eyebrow="YOUR RECORDS"
        title="Health history"
        description="A future unified view of your records, grouped by journey and kept separate when you switch journeys."
      />
      <section className="section-card">
        <div className="empty-state">
          <span className="empty-state-icon">♡</span>
          <h2>Your history will appear here</h2>
          <p>
            The health-history screen is ready for integration. Actual check-in
            records, profile filtering, history queries and data export must be
            connected to the local database module before this page can display
            saved health records.
          </p>
        </div>
      </section>
    </div>
  );
}