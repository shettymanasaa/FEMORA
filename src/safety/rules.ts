import { Journey, SafetyResult, ReviewStatus, SafetyLevel } from '../types';

export interface SafetyRule {
  id: string;
  journey: Journey;
  level: SafetyLevel;
  messageKey: string;
  sourceId: string;
  reviewStatus: ReviewStatus;
  evaluate: (payload: Record<string, unknown>) => boolean;
}

export const CLINICAL_SAFETY_RULES: SafetyRule[] = [
  // Menstrual Urgent Rules
  {
    id: 'menstrual-heavy-bleeding-urgent',
    journey: 'menstrual',
    level: 'urgent',
    messageKey: 'menstrual_soaking_pads_urgent',
    sourceId: 'ACOG-FAQ095',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const symptoms = (payload.symptoms as string[]) || [];
      const scores = (payload.scores as Record<string, number>) || {};
      return (
        symptoms.includes('heavy_bleeding_soaking_hourly') ||
        (scores.soakingPadsHourly === 1 && scores.durationHours >= 2)
      );
    },
  },
  {
    id: 'menstrual-severe-acute-pain',
    journey: 'menstrual',
    level: 'seek_care',
    messageKey: 'menstrual_severe_pain_seek_care',
    sourceId: 'ACOG-PB182',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const scores = (payload.scores as Record<string, number>) || {};
      return typeof scores.pain === 'number' && scores.pain >= 9;
    },
  },

  // Maternity Urgent Rules (Preeclampsia, Bleeding, Reduced Movements)
  {
    id: 'maternity-preeclampsia-warning',
    journey: 'maternity',
    level: 'urgent',
    messageKey: 'maternity_preeclampsia_urgent',
    sourceId: 'ACOG-PB222',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const symptoms = (payload.symptoms as string[]) || [];
      const hasSevereHeadache = symptoms.includes('severe_headache');
      const hasVisionChanges =
        symptoms.includes('visual_blurring') || symptoms.includes('aura');
      const hasFacialSwelling = symptoms.includes('sudden_facial_edema');
      return (hasSevereHeadache && hasVisionChanges) || (hasSevereHeadache && hasFacialSwelling);
    },
  },
  {
    id: 'maternity-vaginal-bleeding-urgent',
    journey: 'maternity',
    level: 'urgent',
    messageKey: 'maternity_vaginal_bleeding_urgent',
    sourceId: 'ACOG-FAQ038',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const symptoms = (payload.symptoms as string[]) || [];
      return (
        symptoms.includes('bright_red_vaginal_bleeding') ||
        symptoms.includes('vaginal_bleeding')
      );
    },
  },
  {
    id: 'maternity-reduced-fetal-movement',
    journey: 'maternity',
    level: 'urgent',
    messageKey: 'maternity_reduced_movements_urgent',
    sourceId: 'NHS-FetalMovements-2023',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const symptoms = (payload.symptoms as string[]) || [];
      return symptoms.includes('reduced_fetal_movement');
    },
  },

  // Menopause Urgent Rules (Postmenopausal Bleeding)
  {
    id: 'menopause-postmenopausal-bleeding',
    journey: 'menopause',
    level: 'urgent',
    messageKey: 'menopause_bleeding_urgent_review',
    sourceId: 'ACOG-CO734',
    reviewStatus: 'reviewed',
    evaluate: (payload) => {
      const symptoms = (payload.symptoms as string[]) || [];
      return (
        symptoms.includes('postmenopausal_bleeding') ||
        symptoms.includes('unexpected_vaginal_spotting')
      );
    },
  },
];

/**
 * Synchronous local clinical safety evaluation.
 * Runs on every check-in before any AI processing or network interaction.
 * If safety flag is raised, AI must be skipped.
 */
export function evaluateSafety(
  journey: Journey,
  payload: Record<string, unknown>
): SafetyResult {
  try {
    const matchingRules = CLINICAL_SAFETY_RULES.filter(
      (rule) => rule.journey === journey && rule.evaluate(payload)
    );

    if (matchingRules.length === 0) {
      return {
        level: 'none',
        ruleIds: [],
        messageKey: 'safe_normal_parameters',
        reviewStatus: 'reviewed',
      };
    }

    // Prioritize highest severity level
    const hasUrgent = matchingRules.some((r) => r.level === 'urgent');
    const hasSeekCare = matchingRules.some((r) => r.level === 'seek_care');
    const level: SafetyLevel = hasUrgent
      ? 'urgent'
      : hasSeekCare
      ? 'seek_care'
      : 'info';

    const ruleIds = matchingRules.map((r) => r.id);
    const primaryRule =
      matchingRules.find((r) => r.level === level) || matchingRules[0];

    return {
      level,
      ruleIds,
      messageKey: primaryRule.messageKey,
      sourceId: primaryRule.sourceId,
      reviewStatus: primaryRule.reviewStatus,
    };
  } catch {
    // If evaluation fails, fail safe!
    return {
      level: 'seek_care',
      ruleIds: ['safety_eval_fallback'],
      messageKey: 'clinical_evaluation_fallback_notice',
      reviewStatus: 'reviewed',
    };
  }
}
