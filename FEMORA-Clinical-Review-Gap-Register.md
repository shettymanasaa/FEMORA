# FEMORA Clinical Review & Integration Gap Register

**Status:** Working requirements and implementation-gap document  
**Clinical approval:** `PENDING` for all proposed rules and clinical conventions  
**Scope:** Safety engine, menstrual health, maternity, menopause, and test coverage  
**Evidence reviewed:** Uploaded FEMORA source snapshot, including `src/safety/index.ts`, `src/data/public.ts`, `src/journeys/{menstrual,maternity,menopause,checkins}.ts`, `src/core/health/calculations.ts`, `tests/core.test.ts`, `CORE_ENGINE.md`, and `INTEGRATION_CONTRACT.md`.

> This document is a software gap assessment, not medical advice or clinical approval. The external clinical references below are starting points. A suitably qualified clinician must review and approve any clinical rule, threshold, user-facing guidance, or interpretation before it is marked `APPROVED`.

## 1. Status vocabulary

- `PENDING` — not clinically approved or not yet fully verified.
- `APPROVED` — approved by a suitably qualified clinical reviewer, with reviewer role, date, version, and supporting source recorded.
- `REJECTED` — reviewed and rejected; do not ship as an active rule.

Software implementation status and clinical review status must be tracked separately.

## 2. Clinical safety engine

### Current implementation

- Rule catalog: `src/safety/index.ts`, exported as `safetyRules`.
- Evaluation: `evaluateSafety(journey, payload)` in `src/safety/index.ts`.
- Public entry point: `coreApi.evaluateSafety()` in `src/data/public.ts`.
- Check-in integration: `saveCheckIn()` in `src/journeys/checkins.ts` calls the evaluator and returns the safety result with the saved check-in.
- AI integration: `src/integrations/aiPayload.ts` is documented as independently re-evaluating supplied check-ins and blocking payload creation when the canonical safety result is unavailable, unreviewed, or triggered.
- Existing tests in `tests/core.test.ts` include: synchronous public evaluator contract; unavailable/empty-catalog fail-closed result; and AI payload consent/safety gating.

### Current behavior confirmed in source

- `safetyRules` is an empty frozen array.
- The fallback result has `evaluationStatus: 'unavailable'`, `reviewStatus: 'review_pending'`, `triggered: true`, and `messageKey: 'safety.evaluation_unavailable'`.
- Invalid journey/payload input and exceptions return the fallback result.
- The fallback includes wording that this is not a medical assessment and advises contacting a qualified professional or local emergency service if symptoms may be urgent.
- With an empty catalog, AI payload generation is documented as blocked.

### Gaps / requirements

1. Keep the catalog explicitly incomplete until individual rules have approved sources and clinical review.
2. Never map `unavailable`, `review_pending`, invalid input, evaluator exceptions, or an empty catalog to medical clearance or “no risk.”
3. Document the rule registry format: stable rule ID, journey, trigger condition, severity/level, message key, source identifier and exact citation, review status, reviewer role, approval date, and version.
4. Document deterministic evaluation and result propagation: rule registry → `evaluateSafety()` → `coreApi.evaluateSafety()` and check-in result; document AI gate separately.
5. Add tests for empty catalog, malformed payload, invalid journey, thrown rule condition, all rule statuses, duplicate IDs, missing source metadata, and a reviewed matching rule. Test that unreviewed/rejected rules cannot execute.
6. Verify the no-match result for a non-empty reviewed catalog cannot be mistaken for universal medical clearance. UI and API consumers must inspect status fields and display the intended scope/limitations.
7. Clinical review status for the catalog: `PENDING` (catalog empty; no approved rule set evidenced in supplied files).

## 3. Menstrual health

### Current implementation

- Cycle-day, phase and next-period calculation: `src/core/health/calculations.ts` (`cycleDay`, `cyclePhase`, `estimateNextPeriod`).
- Summary and estimate availability: `src/journeys/menstrual.ts` (`menstrualSummary`).
- Input validation and safety-result attachment: `src/journeys/checkins.ts` and `src/journeys/schemas.ts`.
- Existing tests in `tests/core.test.ts` cover cycle day, missing/invalid dates, a regular three-start-date example, insufficient history, irregular history, and invalid dates.

### Current behavior confirmed in source

- Cycle day counts the supplied period-start date as day 1.
- Phase uses a simple ordinal-day heuristic and names the ovulatory window `estimated_ovulatory`.
- Next-period estimate requires at least three unique period-start dates and at least two intervals; each interval must be 15–60 days and the interval spread must be no more than seven days. If the next estimated date is already before `today`, the helper returns no estimate.
- `menstrualSummary` returns unavailable reasons for missing dates, insufficient history, irregular history, and invalid date.
- The summary currently does not explicitly check pregnancy, postpartum state, or hormonal contraception before producing a cycle estimate.

### Gaps / requirements

1. Obtain clinical review of the population and intended use. The cited ACOG document is specifically about girls and adolescents; do not silently treat its ranges as universal adult thresholds.
2. Have a qualified reviewer decide whether the current 15–60 day acceptance range and seven-day spread heuristic are suitable, should be changed, or should remain explicitly non-clinical product heuristics. Do not invent replacement thresholds.
3. Make the estimate's limitations visible in the API/UI; keep predictions explicitly estimates, not contraception or diagnostic advice.
4. Confirm no estimate is returned when dates are missing/invalid, history is insufficient or irregular, and review handling for pregnancy, postpartum transition, and hormonal contraception is explicitly specified.
5. Review edge cases: duplicate starts, future starts, impossible dates, out-of-order history, long gaps, one-off irregular intervals, timezone boundaries, pregnancy, postpartum, and hormonal contraception.
6. Review phase labels and ovulation-window assumptions; these are not clinically approved by existing tests.
7. Add tests for each agreed edge case after the reviewer-approved behavior is documented.
8. Clinical review status for cycle and phase conventions: `PENDING`.

### Reference starting point

- ACOG, *Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign*: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign

## 4. Maternity / pregnancy dating

### Current implementation

- LMP-derived due date and inverse calculation: `src/journeys/maternity.ts` (`dueDateFromLmp`, `lmpFromDueDate`).
- Gestational age, week and trimester: `pregnancyProgress()` in `src/core/health/calculations.ts`.
- Profile timeline and postpartum branch: `maternityTimelineForProfile()` in `src/journeys/maternity.ts`.
- Postpartum transition: `transitionToPostpartum()` and journey state updates in the core journey/access modules.
- Existing tests in `tests/core.test.ts` cover LMP + 280 days, basic week/trimester arithmetic, invalid dates/order, postpartum without a due date, and preservation of pregnancy history through postpartum transition.

### Current behavior confirmed in source

- LMP-derived estimated due date adds 280 calendar days in UTC.
- Pregnancy week is an ordinal count from LMP (week 1 begins on LMP day); trimester buckets are ordinal weeks 1–13, 14–27, and 28 onward.
- Missing/invalid dates return unavailable.
- Postpartum timeline can be returned without a pregnancy due date; existing test checks postpartum state and preservation of earlier records.
- The current timeline returns a derived due date when only LMP is supplied and does not visibly distinguish a clinician-confirmed date from an LMP-derived estimate in the returned object.
- If both LMP and due date are provided, the shown validation rejects invalid dates and due dates before LMP, but does not reconcile whether both values are clinically consistent.

### Gaps / requirements

1. Preserve a clear distinction between LMP-derived estimates, user-entered dates, and clinician-confirmed dating. Do not imply clinician confirmation when none is recorded.
2. Obtain clinical review of the 280-day convention, gestational-age/week boundaries, trimester boundaries, and handling of conflicting LMP/due-date values.
3. Define behavior for uncertain/missing LMP, clinician-adjusted estimated due date, assisted conception if in scope, and dates that disagree; do not invent a policy without review.
4. Verify date-only calculations are timezone-independent and future/past boundaries are handled consistently.
5. Keep postpartum state independent of a due date and preserve historical pregnancy records, check-ins, and appointments. Existing tests provide baseline coverage; add regression coverage for repeated transitions and history integrity if missing.
6. Clinical review status for pregnancy-dating conventions: `PENDING`.

### Reference starting point

- ACOG, *Methods for Estimating the Due Date*: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date

## 5. Menopause symptom tracking

### Current implementation

- Symptom check-in, trend aggregation and stage information: `src/journeys/menopause.ts`.
- Shared aggregation: `summarizeSymptoms()` in `src/journeys/checkins.ts`.
- Existing tests in `tests/core.test.ts` cover saving a menopause check-in, obtaining trends, treatment history, and missing user-supplied stage.

### Current behavior confirmed in source

- `menopauseTrends()` accepts an integer window from 0 to 3650 days and a validated `asOf` date; default window is 30 days.
- The summary aggregates recorded symptom codes, counts only entries with a numeric severity for the count/mean, and returns a null mean if no severity values exist.
- The shared summary uses the supplied date window and excludes records after `asOf`; it does not create observations for days with no check-in.
- `menopauseStageInformation()` returns a supplied non-empty stage or an unavailable result; the shown implementation does not infer stage from age.

### Gaps / requirements

1. Document the symptom vocabulary, allowed severity scale, and meaning of each tracked field; have the vocabulary reviewed.
2. Document the trend window semantics (inclusive cutoff and `asOf` date), how missing check-ins differ from a symptom with no severity, and how sparse data is displayed.
3. Ensure the UI never interprets missing data as absence of symptoms or improvement.
4. Keep tracking separate from diagnosis; do not infer menopause solely from age.
5. Add tests for no data, all missing severity, sparse dates, records on the cutoff and `asOf` boundaries, future records, invalid window/date, and user-supplied stage behavior.
6. Clinical review status for vocabulary and tracking conventions: `PENDING`.

### Reference starting point

- NICE, *Menopause: identification and management*, NG23 Recommendations: https://www.nice.org.uk/guidance/ng23/chapter/Recommendations

## 6. Test mapping and additional test scenarios

The uploaded `tests/core.test.ts` currently includes the following relevant test areas:

| Area | Existing coverage evidenced in source | Additional review/test work |
|---|---|---|
| Safety evaluator | Public synchronous contract; empty/unavailable catalog fail-closed | Rule registry validation; malformed payload; thrown condition; reviewed/unreviewed/rejected rules; duplicate/missing metadata; UI/API never interpret unavailable as clearance |
| Menstrual | Cycle day/phase basics; valid estimate; missing/insufficient/irregular history; invalid dates | Pregnancy/postpartum/contraception handling; future/out-of-order/duplicate starts; approved population-specific thresholds; estimate copy/metadata |
| Maternity | LMP + 280; basic week/trimester; invalid dates/order; postpartum without due date; history preservation | Distinguish estimated vs clinician-confirmed dating; conflicting dates; missing/uncertain LMP; week/trimester boundary cases; repeat transition/history integrity |
| Menopause | Check-in/trend smoke test; missing stage behavior | Symptom vocabulary review; sparse/missing severity behavior; window boundaries; no data vs no symptoms; no age-only diagnosis |

Tests are evidence of software behavior, not proof of clinical validity. New tests should encode only requirements that have been documented and reviewed; avoid hard-coding unapproved clinical thresholds.

## 7. Clinical rule register template

Create one entry per proposed rule. Keep each entry `PENDING` until the approval evidence is recorded.

| Field | Required content |
|---|---|
| Rule ID | Stable, unique identifier |
| Journey | `menstrual`, `maternity`, or `menopause` |
| Purpose | What the rule is intended to detect or communicate |
| Trigger condition | Precise, testable condition from an approved requirement |
| Output / guidance | Reviewed message and intended action |
| Severity | Approved classification, or `not assigned` while pending |
| Source | Exact guideline/document, section/recommendation, version/date, URL |
| Applicability / exclusions | Population and contexts where the rule applies or does not apply |
| Tests | Positive, negative, boundary, malformed-input and unavailable cases |
| Review status | `PENDING`, `APPROVED`, or `REJECTED` |
| Reviewer evidence | Qualified reviewer role/name as appropriate, review date, approval record/version |

## 8. Integration acceptance criteria

- No clinical rule is enabled unless it has a stable ID, a supporting source, an approved message/condition, and recorded qualified clinical approval.
- The empty catalog and every evaluation failure remain visibly unavailable and review-pending, and cannot be displayed as medical clearance.
- Menstrual predictions are labeled estimates and are withheld when approved availability criteria are not met.
- Maternity outputs identify their dating basis and do not imply clinician confirmation without evidence; postpartum state does not require a due date and does not erase prior history.
- Menopause trends explain their time window and sparse/missing-data semantics; tracking is not diagnosis and stage is not inferred solely from age.
- Every approved requirement has linked tests; all clinical items remain `PENDING` until review evidence is recorded.

## 9. Overall review status

| Domain | Software mechanism | Clinical status |
|---|---|---|
| Safety catalog | Implemented; catalog empty | `PENDING` |
| Menstrual calculations | Implemented heuristic | `PENDING` |
| Pregnancy dating | Implemented LMP-based convention | `PENDING` |
| Menopause tracking | Implemented symptom aggregation | `PENDING` |
| Clinical sources and approvals | Not evidenced in supplied source snapshot | `PENDING` |

## 10. External references

- ACOG, *Menstruation in Girls and Adolescents: Using the Menstrual Cycle as a Vital Sign*: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign
- ACOG, *Methods for Estimating the Due Date*: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date
- NICE NG23, *Menopause: identification and management — Recommendations*: https://www.nice.org.uk/guidance/ng23/chapter/Recommendations

These are reference starting points only. The reviewer must confirm current applicability, exact recommendation/section, population, and any local policy before a rule or requirement is approved.
