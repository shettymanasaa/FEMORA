/**
 * FEMORA - Shared Types and Data Model Definitions
 * Defined as the source of truth across all three roles (Frontend, Core Engine, AI/Reports).
 */

export type Journey = 'menstrual' | 'maternity' | 'menopause';

export type ReviewStatus = 'reviewed' | 'pending';

export type SafetyLevel = 'none' | 'info' | 'seek_care' | 'urgent';

export interface SafetyResult {
  level: SafetyLevel;
  ruleIds: string[];
  messageKey: string;
  sourceId?: string;
  reviewStatus: ReviewStatus;
}

export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code:
        | 'VALIDATION'
        | 'STORAGE_FULL'
        | 'LOCKED'
        | 'NOT_FOUND'
        | 'AI_DISABLED'
        | 'PROVIDER_ERROR'
        | 'NETWORK_ERROR'
        | 'UNKNOWN';
      message: string;
    };

export interface Profile {
  id: string; // UUID
  nickname: string;
  displayName?: string;
  avatar?: string; // botanical icon or color name
  avatarColor?: string;
  activeJourneys?: Journey[];
  lastActiveJourney?: Journey;
  activeJourney?: Journey;
  hasPin?: boolean;
  pinSalt?: string;
  kdfParams?: {
    iterations: number;
    hash: string;
  };
  pinCheck?: string;
  isSample?: boolean;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export interface HealthProfile {
  profileId: string;
  journey?: Journey;
  payload?: {
    conditions?: string[];
    allergies?: string[];
    medicines?: string[];
    age?: number;
    dateOfBirth?: string;
    height?: number;
    weight?: number;
  };
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  notes?: string;
  updatedAt?: string;
}

export interface JourneyProfile {
  id: string;
  profileId: string;
  journey: Journey;
  status: 'incomplete' | 'complete' | 'active' | 'historical';
  payload?: {
    // Menstrual
    typicalCycleLengthDays?: number;
    typicalPeriodLengthDays?: number;
    lastPeriodDate?: string;
    // Maternity
    status?: 'pregnant' | 'postpartum';
    dueDate?: string;
    pregnancyWeek?: number;
    deliveryDate?: string;
    careProvider?: string;
    // Menopause
    stage?: 'perimenopause' | 'menopause' | 'postmenopause';
    goals?: string[];
    [key: string]: unknown;
  };
  startedAt?: string;
  endedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface Checkin {
  id: string;
  profileId: string;
  journey: Journey;
  loggedAt: string; // ISO
  payload: {
    symptoms: string[];
    scores?: Record<string, number>; // e.g. pain: 4, mood: 7, sleepHours: 6
    mood?: string;
    lifestyleValues?: Record<string, unknown>;
    note?: string; // Stored locally only! Never sent to AI.
    [key: string]: unknown;
  };
  isSample?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type RecordType =
  | 'cycle'
  | 'pregnancy_log'
  | 'postpartum_log'
  | 'menopause_log'
  | 'birth_plan'
  | 'hospital_checklist_item'
  | 'doctor_question'
  | 'treatment'
  | 'sexual_wellbeing';

export interface RecordItem {
  id: string;
  profileId: string;
  journey: Journey;
  type: RecordType;
  loggedAt: string;
  payload: Record<string, unknown>;
  isSample?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  profileId?: string;
  journey?: Journey;
  title?: string;
  date?: string;
  time?: string;
  startsAt?: string; // ISO string
  dateTime?: string;
  reminderOffsetMinutes?: number;
  status?: 'upcoming' | 'done' | 'cancelled';
  payload?: {
    title: string;
    location?: string;
    notes?: string;
  };
  notes?: string;
  isSample?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationKind =
  | 'appointment_reminder'
  | 'checkin_reminder'
  | 'content_pending_review';

export interface AppNotification {
  id: string;
  profileId: string;
  kind?: NotificationKind;
  type?: string;
  message?: string;
  refId?: string;
  messageKey?: string;
  params?: Record<string, string | number>;
  createdAt: string;
  readAt?: string;
  isSample?: boolean;
}

export type ConsentScope =
  | 'local_health_data'
  | 'ai_numbers_only'
  | 'analytics'
  | 'sexual_wellbeing';

export interface Consent {
  id: string;
  profileId: string;
  scope?: ConsentScope;
  purpose?: string;
  journey?: Journey;
  granted: boolean;
  policyVersion: string;
  grantedAt?: string;
  capturedAt?: string;
  isSample?: boolean;
}

export interface Settings {
  profileId: string;
  theme?: 'light' | 'dark' | 'system';
  textSize?: 'small' | 'medium' | 'large' | number;
  notificationPrefs?: {
    appointments?: boolean;
    checkins?: boolean;
    educationalAlerts?: boolean;
    [key: string]: boolean | undefined;
  };
  aiEnabled?: boolean;
  analyticsEnabled?: boolean;
  sexualWellbeingVisible?: boolean;
  pinEnabled?: boolean;
  pinSalt?: string;
  pinCheck?: string;
  kdfVersion?: number;
  kdfIterations?: number;
  encryptedDataKey?: string;
  lockAfterMs?: number;
  isSample?: boolean;
}

export interface Bookmark {
  id: string;
  profileId: string;
  topicId?: string;
  targetId?: string;
  targetType?: string;
  journey?: Journey;
  createdAt: string;
  isSample?: boolean;
}

export interface RecentlyViewed {
  id: string;
  profileId: string;
  topicId?: string;
  targetId?: string;
  targetType?: string;
  journey?: Journey;
  viewedAt: string;
  isSample?: boolean;
}

// -------------------------------------------------------------
// Medical Content Types
// -------------------------------------------------------------

export interface ContentSource {
  name: string;
  url?: string;
  organization: string;
  year?: number;
  quoteOrSummary?: string;
}

export interface ContentTopic {
  id: string;
  title: string;
  journey: Journey | 'shared';
  sources: ContentSource[];
  reviewStatus: ReviewStatus;
  content: string; // Markdown body
  keywords?: string[];
  summary?: string;
}

export interface ContentSearchResult {
  id: string;
  title: string;
  journey: Journey | 'shared';
  excerpt: string;
  sources: ContentSource[];
  reviewStatus: ReviewStatus;
  score?: number;
}

// -------------------------------------------------------------
// AI Proxy & Client Types
// -------------------------------------------------------------

export interface ContentPassage {
  id: string;
  text: string;
}

/**
 * Strict whitelist for AI request payload.
 * No names, no exact calendar dates, no notes, no sexual wellbeing.
 */
export interface AiPayload {
  journey: Journey;
  window: string; // e.g. "last 3 cycles", "last 4 weeks", "current trimester"
  metrics: Record<string, number>;
  symptomIds: string[];
  contentPassages: ContentPassage[];
}

export interface AiResponse {
  text: string;
  provider: 'gemini' | 'grok' | 'local_fallback';
  disclaimer: string;
}

// -------------------------------------------------------------
// Report Types
// -------------------------------------------------------------

export type ReportType = 'menstrual' | 'maternity' | 'menopause';

export interface ReportSectionOption {
  id: string;
  title: string;
  included: boolean;
  isOptional: boolean;
}

export interface ReportConfig {
  journey: Journey;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  includeSexualWellbeing?: boolean;
  sections: string[]; // List of section IDs to include
}

export interface ReportData {
  reportType: ReportType;
  journey: Journey;
  periodLabel: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  profileNickname: string;
  isSample: boolean;
  metrics: Record<string, number | string>;
  symptomsSummary: Array<{
    symptomId: string;
    name: string;
    count: number;
    avgScore?: number;
  }>;
  trends: Array<{
    period: string;
    summary: string;
  }>;
  appointments?: Array<{
    date: string;
    title: string;
    status: string;
  }>;
  notes?: string[];
  aiExplanation?: string;
  sexualWellbeingSection?: {
    recordsCount: number;
    summary: string;
  };
  sectionsIncluded: string[];
  disclaimer: string;
}

// -------------------------------------------------------------
// UI Types
// -------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'system';

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

export interface CheckInSummary {
  date: string;
  journey: Journey;
  symptoms: string[];
  mood?: number;
  pain?: number;
}

export type {
  PublicProfile,
  ProfileCreation,
  StoragePersistenceStatus,
  ProfileWipeResult,
  EncryptedBackup
} from './core/contracts';
