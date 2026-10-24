# FEMORA — Data Flow & Privacy Boundaries

FEMORA is engineered to maximize patient privacy by minimizing external data transmission.

```mermaid
flowchart LR
    subgraph StaysOnDevice ["STRICTLY LOCAL (Device Only)"]
        direction TB
        A[Personal Names & Nicknames]
        B[Exact Calendar Dates & Birthdays]
        C[Free-Text Clinical Notes & Diaries]
        D[Appointment Locations & Clinician Names]
        E[Sexual Wellbeing Logs]
        F[Raw Database Records & PIN Salts]
        G[Safety Evaluation Engine]
        H[Full Educational Markdown Library]
    end

    subgraph MayLeaveDevice ["STRICT ALLOWLIST (Leaves Device to /api/ai)"]
        direction TB
        W1[Life Stage Journey: menstrual | maternity | menopause]
        W2[Relative Window: e.g. last 3 cycles]
        W3[Aggregate Numeric Metrics: e.g. cycleLengthAvg: 28]
        W4[Approved Symptom IDs: e.g. cramps, fatigue]
        W5[Reviewed Clinical Passages: grounded text only]
    end

    StaysOnDevice -.->|Filtered by buildAiPayload| MayLeaveDevice
```

---

## 1. What Stays on the Device (Never Transmitted)

| Data Category | Examples / Fields | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Identities** | Names, nicknames, profile UUIDs | Omitted from `AiPayload` allowlist schema. |
| **Dates** | Exact calendar dates, dates of birth, LMP dates | Replaced by relative spans (e.g., "last 3 cycles", "week 32"). |
| **Health Notes** | Daily free-text notes, diary reflections | Filtered out by `buildAiPayload()`. |
| **Appointments** | Doctor names, clinic addresses, room numbers | Kept in local Dexie DB only. |
| **Sexual Wellbeing** | Comfort scores, frequency, intimate notes | Completely blocked from AI proxy. |
| **PIN & Keys** | PIN salts, PBKDF2 iterations, check values | Evaluated entirely in client memory. |
| **Medical Corpus** | Full content library | Filtered on-device; only 2-3 reviewed passages are sent. |

---

## 2. What Leaves the Device (Only With Explicit Consent)

When a user requests an AI explanation, only an anonymous numeric and categorical payload is compiled:

```json
{
  "journey": "menstrual",
  "window": "last 3 cycles",
  "metrics": {
    "cycleLengthAvg": 28,
    "painScoreAvg": 4.2,
    "symptomDaysCount": 6
  },
  "symptomIds": ["cramps", "fatigue", "bloating"],
  "contentPassages": [
    {
      "id": "menstrual-cycle-basics",
      "text": "The menstrual cycle has four phases..."
    }
  ]
}
```

### Pre-Transmission Checks:
1. **Safety Evaluation:** If the check-in triggered a safety alert (`safetyFlagRaised === true`), the AI request is immediately blocked on the client.
2. **Consent & Setting:** If `aiEnabled === false` or `hasConsent === false`, no network request is dispatched; local rule-based insights are returned instead.
3. **What Gets Sent Preview:** The user can inspect the exact JSON before approving transmission.
4. **Server Re-Validation:** `/api/ai` uses `AiPayloadSchema.strict()` to reject any unrecognized fields with HTTP 400.
