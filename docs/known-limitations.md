# FEMORA — Known Limitations & Risk Disclosures

As a hackathon prototype and privacy-first progressive application, FEMORA operates under intentional design boundaries and known platform limitations.

---

## 1. Local-First Browser Storage Limitations

- **Browser-Specific Storage:** All health records, check-ins, appointments, and preferences are stored exclusively in the browser's IndexedDB. Data does **not** automatically sync across devices, different browsers, or private/incognito tabs.
- **Data Loss Risks:** If a user clears their browser cache, resets site data, or if the operating system initiates automated storage eviction (e.g., iOS Safari 7-day eviction policy for inactive web apps), locally stored data may be permanently lost unless an encrypted backup export has been saved.
- **Backup Recommendation:** Users should regularly utilize the encrypted backup export (`femora-backup-v1`) to safeguard records.

---

## 2. Multi-Profile Security Boundaries

- **Profiles Without a PIN:** Multi-user profiles on a shared device allow different family members to keep separate timelines, but **without a PIN, profiles do not constitute a cryptographic security boundary**. Anyone with access to the browser can switch between non-PIN profiles.
- **PIN Recovery:** To prevent credential backdoors, FEMORA does not store passwords or PINs on any server. Consequently, **a forgotten PIN cannot be recovered by customer support**. The user must restore from a previous backup file.

---

## 3. External AI Provider & Privacy Considerations

- **Data-Use & Retention Policies:** Before deploying FEMORA to real users in clinical environments, administrators must verify the specific enterprise terms of service with Google (Gemini) and xAI (Grok). Free API tiers may retain submitted requests or use data for model training. **Real-world deployments must use enterprise zero-data-retention endpoints with training opt-outs**.
- **Connectivity Dependency:** While tracking, safety evaluation, content search, and report generation work 100% offline, AI-generated explanations require an active internet connection. When offline, FEMORA automatically provides local, rule-based insights.

---

## 4. Clinical Review Requirements

- **Non-Diagnostic Notice:** FEMORA is an educational and clinical communication tool designed to assist patient-physician dialogue. **It does not provide medical diagnoses, clinical triaging, or emergency intervention.**
- **Pending Material:** Topics tagged as `pending` in the content library have been drafted from clinical literature but await final validation by an independent medical advisory board. Pending topics are visibly labeled and are strictly excluded from AI prompt grounding.
- **Emergency Symptoms:** Users experiencing severe symptoms (e.g., suspected ectopic pregnancy, severe preeclampsia signs, postmenopausal bleeding, or acute hemorrhaging) must seek emergency medical care immediately and must not rely on app summaries.
