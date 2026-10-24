import { AiPayload, Journey } from '../types';

/**
 * Generates an on-device, rule-based clinical educational insight.
 * Used when AI is disabled, offline, or when both Gemini and Grok are unreachable.
 * Guaranteed to operate without network, without external servers, and without risk of hallucination.
 */
export function generateLocalRuleBasedExplanation(payload: AiPayload): string {
  const parts: string[] = [];

  parts.push(
    `Based on your recorded ${payload.window} for the ${payload.journey} life stage:`
  );

  // Journey specific rule-based evaluation
  if (payload.journey === 'menstrual') {
    const cycleLength = payload.metrics.cycleLengthAvg || payload.metrics.cycleLength;
    const painScore = payload.metrics.painScoreAvg || payload.metrics.painScore;

    if (cycleLength !== undefined) {
      if (cycleLength >= 21 && cycleLength <= 35) {
        parts.push(
          `• Cycle Frequency: Your average cycle length of ${cycleLength} days falls within the established typical adult clinical range (21–35 days).`
        );
      } else {
        parts.push(
          `• Cycle Frequency: An average cycle length of ${cycleLength} days shows variation from typical adult parameters. Discussing this interval with a doctor can clarify whether ovulatory variations are present.`
        );
      }
    }

    if (painScore !== undefined) {
      if (painScore > 6) {
        parts.push(
          `• Discomfort Levels: An average recorded discomfort score of ${painScore}/10 indicates substantial symptoms during menses. Tracking which days pain peaks will help your clinician evaluate for secondary dysmenorrhea or inflammatory causes.`
        );
      } else if (painScore > 0) {
        parts.push(
          `• Discomfort Levels: Recorded discomfort is mild to moderate (${painScore}/10). Heat therapy and consistent hydration frequently provide symptomatic comfort.`
        );
      }
    }

    if (payload.symptomIds.length > 0) {
      parts.push(
        `• Symptoms Identified: You logged ${payload.symptomIds.join(', ')}. Monitoring how these correlate with cycle days helps determine whether they follow follicular or luteal hormonal patterns.`
      );
    }
  } else if (payload.journey === 'maternity') {
    const week = payload.metrics.pregnancyWeek || payload.metrics.week;
    if (week !== undefined) {
      const trimester = week <= 13 ? '1st' : week <= 27 ? '2nd' : '3rd';
      parts.push(
        `• Antenatal Stage: At week ${week} (${trimester} trimester), physiological adaptations are actively underway. Prioritize scheduled antenatal screenings and adequate hydration.`
      );
    }

    if (payload.symptomIds.length > 0) {
      parts.push(
        `• Recorded Symptoms: Tracking ${payload.symptomIds.join(', ')} provides concrete data for your midwife or obstetrician visits.`
      );
    }
  } else if (payload.journey === 'menopause') {
    const hotFlashes =
      payload.metrics.hotFlashesPerWeek || payload.metrics.vasomotorEpisodes;
    const sleepDisruption =
      payload.metrics.sleepScoreAvg || payload.metrics.sleepDisruptionCount;

    if (hotFlashes !== undefined) {
      parts.push(
        `• Vasomotor Frequency: Logging ${hotFlashes} vasomotor episodes helps identify environmental triggers (such as caffeine or ambient room temperature) and evaluate response to supportive measures.`
      );
    }

    if (sleepDisruption !== undefined) {
      parts.push(
        `• Sleep Continuity: Sleep changes frequently accompany vasomotor shifts during the menopausal transition. Establishing a cool sleeping environment and consistent routines can support rest.`
      );
    }
  }

  // Include reference grounded statement if passages were provided
  if (payload.contentPassages.length > 0) {
    const topicIds = payload.contentPassages.map((p) => p.id).join(', ');
    parts.push(
      `• Evidence Grounding: Cross-referenced with reviewed educational topic(s) [${topicIds}].`
    );
  }

  parts.push(
    '\nRecommended next steps: Share this trend summary with your doctor or healthcare provider at your next routine check-up. Remember that automated summaries are for education and do not replace professional clinical evaluation.'
  );

  return parts.join('\n\n');
}
