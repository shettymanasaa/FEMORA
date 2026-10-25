import type { Journey } from "../types";

export const journeyRoutes: Record<
  Journey,
  {
    home: string;
    checkIn: string;
    insights: string;
    report: string;
    learn: string;
  }
> = {
  menstrual: {
    home: "/menstrual",
    checkIn: "/menstrual/check-in",
    insights: "/menstrual/insights",
    report: "/menstrual/report",
    learn: "/menstrual/learn",
  },
  maternity: {
    home: "/maternity/dashboard",
    checkIn: "/maternity/check-in",
    insights: "/maternity/report",
    report: "/maternity/report",
    learn: "/maternity/learn",
  },
  menopause: {
    home: "/menopause/dashboard",
    checkIn: "/menopause/check-in",
    insights: "/menopause/insights",
    report: "/menopause/report",
    learn: "/menopause/learn",
  },
};

export function journeyHome(journey?: Journey): string {
  if (!journey) return "/select-journey";
  return journeyRoutes[journey].home;
}