import type { EducationArticle, Journey } from "../types";

export const mockArticles: EducationArticle[] = [
  {
    id: "cycle-basics",
    title: "Understanding your menstrual cycle",
    category: "Menstrual health",
    summary:
      "Learn about cycle phases, common patterns and how to record changes over time.",
    reviewed: false,
    journey: "menstrual",
  },
  {
    id: "pregnancy-preparation",
    title: "Preparing for antenatal appointments",
    category: "Maternity",
    summary:
      "A general guide to organising questions and information for your care team.",
    reviewed: false,
    journey: "maternity",
  },
  {
    id: "menopause-basics",
    title: "Understanding the menopause transition",
    category: "Perimenopause & menopause",
    summary:
      "Explore common topics to discuss with a qualified healthcare professional.",
    reviewed: false,
    journey: "menopause",
  },
  {
    id: "wellbeing-notes",
    title: "Building a wellbeing journal",
    category: "Everyday wellbeing",
    summary:
      "Simple ways to keep notes about your day and prepare for health conversations.",
    reviewed: false,
  },
];

export const journeyDescriptions: Record<Journey, string> = {
  menstrual: "Cycle tracking, daily check-ins and menstrual wellbeing.",
  maternity: "Pregnancy preparation, check-ins and postpartum organisation.",
  menopause: "Symptom tracking, wellbeing patterns and ongoing care.",
};

export const sampleLabel = "Illustrative sample content — not medical advice.";