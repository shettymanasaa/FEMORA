import type { Journey } from "../types";

export const APP_NAME = "FEMORA";
export const APP_TAGLINE = "Care for every phase of her life.";

export const JOURNEYS: {
  id: Journey;
  title: string;
  subtitle: string;
  description: string;
  symbol: string;
}[] = [
  {
    id: "menstrual",
    title: "Menstrual health",
    subtitle: "Understand your cycle",
    description:
      "Track cycle patterns, symptoms and wellbeing, and explore reviewed educational resources.",
    symbol: "◒",
  },
  {
    id: "maternity",
    title: "Maternity",
    subtitle: "Pregnancy and beyond",
    description:
      "Organise pregnancy check-ins, birth preparation and postpartum recovery.",
    symbol: "✿",
  },
  {
    id: "menopause",
    title: "Perimenopause & menopause",
    subtitle: "Navigate change with care",
    description:
      "Record symptoms, notice patterns and prepare for conversations with your clinician.",
    symbol: "☼",
  },
];

export const STORAGE_KEYS = {
  profiles: "femora.local-profiles.v1",
  activeProfile: "femora.active-profile.v1",
  theme: "femora.theme.v1",
} as const;

export const ROUTES = {
  welcome: "/",
  profiles: "/profiles",
  createProfile: "/profiles/new",
  onboarding: "/onboarding",
  selectJourney: "/select-journey",
  home: "/home",
  learn: "/learn",
  appointments: "/appointments",
  healthHistory: "/profile/health-history",
  settings: "/settings",
  privacySettings: "/settings/privacy",
  privacyPolicy: "/legal/privacy",
  terms: "/legal/terms",
} as const;