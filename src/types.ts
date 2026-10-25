export type Journey = "menstrual" | "maternity" | "menopause";

export type Theme = "light" | "dark" | "system";

export interface LocalProfile {
  id: string;
  nickname: string;
  avatarColor: string;
  journey?: Journey;
  createdAt: string;
  isSample?: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  reviewed: boolean;
  journey?: Journey;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  notes?: string;
}

export interface CheckInSummary {
  date: string;
  journey: Journey;
  symptoms: string[];
  mood?: number;
  pain?: number;
}