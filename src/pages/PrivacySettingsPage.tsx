import { useState, useRef, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../ui/common/PageHeader";
import { useAppContext } from "../app/providers";
import { coreApi } from "../data/public";
import type { EncryptedBackup } from "../core/contracts";

export default function PrivacySettingsPage() {
  const { activeProfile, clearActiveProfile } = useAppContext();
  const profileId = activeProfile?.id ?? "";
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportBackup() {
    if (!profileId) {
      setError("Please select a profile first.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await coreApi.exportBackup(profileId);
      if (!res.ok) {
        setError(res.message || "Failed to export backup.");
        return;
      }

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `femora-backup-${activeProfile?.nickname || "profile"}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage("Backup file exported successfully. Keep this file in a safe, private location.");
    } catch {
      setError("An error occurred while creating your backup file.");
    } finally {
      setLoading(false);
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as EncryptedBackup;

      if (!parsed || parsed.format !== "femora-backup-v1") {
        setError("Invalid backup file. File must be a valid FEMORA v1 backup format.");
        return;
      }

      const res = await coreApi.restoreBackup(undefined, parsed);
      if (!res.ok) {
        setError(res.message || "Failed to restore backup.");
        return;
      }

      setMessage("Backup restored successfully into your local browser database!");
    } catch {
      setError("Failed to parse the backup file. Ensure it is valid JSON.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleWipeData() {
    if (!profileId) return;

    const confirmed = window.confirm(
      `Are you completely sure you want to wipe all records for "${activeProfile?.nickname}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await coreApi.wipeProfile(profileId);
      clearActiveProfile();
      alert("All records for this profile have been securely wiped from browser storage.");
      navigate("/profiles");
    } catch {
      setError("Failed to complete data wipe. Try again.");
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="LOCAL DATA PRIVACY &amp; VAULT"
        title="Privacy &amp; Data Controls"
        description="FEMORA is 100% local-first. Export encrypted backups, restore previous archives, or permanently wipe your local records."
      />

      {message && (
        <div className="section-card" style={{ background: "#f0fdf4", border: "1px solid #4ade80", marginBottom: 20 }}>
          <p style={{ color: "#15803d", margin: 0 }}>✓ {message}</p>
        </div>
      )}

      {error && (
        <div className="section-card" style={{ background: "#fef2f2", border: "1px solid #f87171", marginBottom: 20 }}>
          <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: 20 }}>
        {/* Local Storage Card */}
        <section className="section-card">
          <p className="eyebrow">DEVICE ARCHITECTURE</p>
          <h2>Local Profile Storage</h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#555" }}>
            Your health records, cycle start dates, and check-in logs reside in your browser&apos;s
            IndexedDB storage. They never sync to cloud databases without your explicit export.
          </p>
          <span className="tag" style={{ background: "#e8ede6", color: "#3b5e34", fontWeight: 600 }}>
            🔒 Local-First Storage
          </span>
        </section>

        {/* AI & Telemetry Card */}
        <section className="section-card">
          <p className="eyebrow">SAFETY &amp; AI GATING</p>
          <h2>On-Device Safety Gating</h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#555" }}>
            All safety evaluations run locally using deterministic clinical rules (ACOG / RCOG / NAMS).
            If an optional AI feature is triggered, private identifiers are automatically stripped.
          </p>
          <span className="tag" style={{ background: "#f0fdf4", color: "#15803d", fontWeight: 600 }}>
            🛡️ Local Safety Rules First
          </span>
        </section>

        {/* Backup Export / Restore Card */}
        <section className="section-card">
          <p className="eyebrow">DATA PORTABILITY</p>
          <h2>Encrypted Backup &amp; Restore</h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#555", marginBottom: 16 }}>
            Download an encrypted archive of all eleven profile tables or restore records from a previously saved file.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="button button-primary"
              onClick={handleExportBackup}
              disabled={loading || !profileId}
            >
              {loading ? "Exporting..." : "⬇ Export Backup (JSON)"}
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={handleImportClick}
              disabled={loading}
            >
              ⬆ Restore from File
            </button>
          </div>
        </section>

        {/* Wipe Data Card */}
        <section className="section-card">
          <p className="eyebrow">PERMANENT DATA WIPE</p>
          <h2>Erase Profile Records</h2>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#555", marginBottom: 16 }}>
            Permanently delete all check-in entries, appointments, birth plans, and logs for the active profile.
          </p>

          <button
            type="button"
            className="button button-secondary"
            style={{ color: "#dc2626", borderColor: "#f87171" }}
            onClick={handleWipeData}
            disabled={!profileId}
          >
            🗑 Wipe All Local Records
          </button>
        </section>
      </div>

      <div className="section-card" style={{ marginTop: 24 }}>
        <p className="eyebrow">LEGAL DOCUMENTATION</p>
        <h2>Privacy Policy &amp; Terms</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 12 }}>
          Learn more about FEMORA&apos;s privacy commitments, data isolation models, and algorithmic transparency.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="button button-secondary" to="/legal/privacy">
            Privacy Policy
          </Link>
          <Link className="button button-secondary" to="/legal/terms">
            Terms of Use
          </Link>
        </div>
      </div>
    </main>
  );
}
