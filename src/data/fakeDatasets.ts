import {
  Profile,
  HealthProfile,
  JourneyProfile,
  Checkin,
  RecordItem,
  Appointment,
  AppNotification,
  Consent,
  Settings,
} from '../types';
import { db, FemoraDatabase } from './db';

// =========================================================================
// Persona 1: Menstrual Health Tracking (Priya Sharma, Age 26)
// =========================================================================
export const MENSTRUAL_PERSONA_ID = 'fake-profile-menstrual-01';

export const MENSTRUAL_PROFILE: Profile = {
  id: MENSTRUAL_PERSONA_ID,
  nickname: 'Priya (Menstrual Demo)',
  displayName: 'Priya Sharma',
  avatar: 'botanical-rose',
  avatarColor: '#C77D88',
  activeJourneys: ['menstrual'],
  lastActiveJourney: 'menstrual',
  activeJourney: 'menstrual',
  hasPin: false,
  isSample: true,
  createdAt: '2026-08-15T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENSTRUAL_HEALTH_PROFILE: HealthProfile = {
  profileId: MENSTRUAL_PERSONA_ID,
  journey: 'menstrual',
  payload: {
    age: 26,
    dateOfBirth: '2000-05-12',
    height: 165,
    weight: 58,
    conditions: ['Mild Dysmenorrhea'],
    allergies: ['None'],
    medicines: ['Ibuprofen as needed during cycle day 1-2'],
  },
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENSTRUAL_JOURNEY_PROFILE: JourneyProfile = {
  id: 'jp-fake-menstrual',
  profileId: MENSTRUAL_PERSONA_ID,
  journey: 'menstrual',
  status: 'active',
  payload: {
    typicalCycleLengthDays: 29,
    typicalPeriodLengthDays: 5,
    lastPeriodDate: '2026-10-05T00:00:00.000Z',
  },
  createdAt: '2026-08-15T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENSTRUAL_CHECKINS: Checkin[] = [
  // Cycle 1 (September)
  {
    id: 'chk-m-01',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    loggedAt: '2026-09-06T09:00:00.000Z',
    payload: {
      symptoms: ['period_start', 'cramps', 'fatigue'],
      scores: { pain: 6, mood: 5, flow: 3 },
      mood: 'tired',
      note: 'Cycle day 1. Moderate cramps in lower abdomen.',
    },
    isSample: true,
    createdAt: '2026-09-06T09:00:00.000Z',
  },
  {
    id: 'chk-m-02',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    loggedAt: '2026-09-07T09:00:00.000Z',
    payload: {
      symptoms: ['cramps', 'heavy_flow', 'bloating'],
      scores: { pain: 5, mood: 6, flow: 3 },
      mood: 'calm',
    },
    isSample: true,
    createdAt: '2026-09-07T09:00:00.000Z',
  },
  {
    id: 'chk-m-03',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    loggedAt: '2026-09-18T09:00:00.000Z',
    payload: {
      symptoms: ['ovulation_signs', 'high_energy'],
      scores: { pain: 1, mood: 9 },
      mood: 'energetic',
      note: 'Estimated fertile window. Increased vitality.',
    },
    isSample: true,
    createdAt: '2026-09-18T09:00:00.000Z',
  },
  // Cycle 2 (October)
  {
    id: 'chk-m-04',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    loggedAt: '2026-10-05T09:00:00.000Z',
    payload: {
      symptoms: ['period_start', 'cramps', 'headache'],
      scores: { pain: 5, mood: 5, flow: 3 },
      mood: 'irritable',
      note: 'Period arrived on day 29, exactly on schedule.',
    },
    isSample: true,
    createdAt: '2026-10-05T09:00:00.000Z',
  },
  {
    id: 'chk-m-05',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    loggedAt: '2026-10-06T09:00:00.000Z',
    payload: {
      symptoms: ['fatigue', 'mild_cramps'],
      scores: { pain: 3, mood: 7, flow: 2 },
      mood: 'relaxed',
    },
    isSample: true,
    createdAt: '2026-10-06T09:00:00.000Z',
  },
];

export const MENSTRUAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-m-01',
    profileId: MENSTRUAL_PERSONA_ID,
    journey: 'menstrual',
    title: 'Annual Well-Woman Gynecological Consultation',
    date: '2026-11-12',
    time: '10:30',
    startsAt: '2026-11-12T10:30:00.000Z',
    status: 'upcoming',
    payload: {
      title: 'Annual Well-Woman Gynecological Consultation',
      location: 'City Women’s Health Clinic, Suite 402',
      notes: 'Review menstrual cycle regularities and update cervical screening.',
    },
    notes: 'Review menstrual cycle regularities and update cervical screening.',
    isSample: true,
    createdAt: '2026-10-01T08:00:00.000Z',
  },
];

// =========================================================================
// Persona 2: Maternity Care (Aria Chen, Age 30, Week 24)
// =========================================================================
export const MATERNITY_PERSONA_ID = 'fake-profile-maternity-02';

export const MATERNITY_PROFILE: Profile = {
  id: MATERNITY_PERSONA_ID,
  nickname: 'Aria (Maternity Demo)',
  displayName: 'Aria Chen',
  avatar: 'botanical-branch',
  avatarColor: '#8C9B83',
  activeJourneys: ['maternity'],
  lastActiveJourney: 'maternity',
  activeJourney: 'maternity',
  hasPin: false,
  isSample: true,
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MATERNITY_HEALTH_PROFILE: HealthProfile = {
  profileId: MATERNITY_PERSONA_ID,
  journey: 'maternity',
  payload: {
    age: 30,
    dateOfBirth: '1996-03-22',
    height: 168,
    weight: 66,
    conditions: ['None'],
    allergies: ['Latex'],
    medicines: ['Prenatal Iron + Folic Acid Multivitamin'],
  },
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MATERNITY_JOURNEY_PROFILE: JourneyProfile = {
  id: 'jp-fake-maternity',
  profileId: MATERNITY_PERSONA_ID,
  journey: 'maternity',
  status: 'active',
  payload: {
    status: 'pregnant',
    pregnancyWeek: 24,
    dueDate: '2027-02-14T00:00:00.000Z',
    careProvider: 'Community Midwifery Practice - Dr. Sarah Jenkins',
  },
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MATERNITY_CHECKINS: Checkin[] = [
  {
    id: 'chk-mat-01',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    loggedAt: '2026-10-18T10:00:00.000Z',
    payload: {
      symptoms: ['active_fetal_movement', 'mild_back_ache'],
      scores: { kicksCount: 14, pain: 2, mood: 8 },
      mood: 'joyful',
      note: 'Distinct flutter kicks noticed after breakfast.',
    },
    isSample: true,
    createdAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'chk-mat-02',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    loggedAt: '2026-10-22T10:00:00.000Z',
    payload: {
      symptoms: ['active_fetal_movement', 'good_energy'],
      scores: { kicksCount: 16, pain: 1, mood: 9 },
      mood: 'happy',
    },
    isSample: true,
    createdAt: '2026-10-22T10:00:00.000Z',
  },
  {
    id: 'chk-mat-03',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    loggedAt: '2026-10-25T08:30:00.000Z',
    payload: {
      symptoms: ['active_fetal_movement', 'mild_foot_edema'],
      scores: { kicksCount: 15, pain: 2, mood: 8 },
      mood: 'calm',
      note: 'Week 24 milestone check-in. Normal hydration and resting elevation.',
    },
    isSample: true,
    createdAt: '2026-10-25T08:30:00.000Z',
  },
];

export const MATERNITY_RECORDS: RecordItem[] = [
  {
    id: 'rec-mat-birthplan-01',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    type: 'birth_plan',
    loggedAt: '2026-10-15T12:00:00.000Z',
    payload: {
      atmosphere: 'Dim lighting, calm music',
      mobility: 'Freedom to move and use birth ball',
      cordClamping: 'Delayed cord clamping requested (minimum 2 minutes)',
      skinToSkin: 'Immediate skin-to-skin contact for golden hour',
      painManagement: 'Hydrotherapy first, nitrous oxide as secondary',
    },
    isSample: true,
    createdAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'rec-mat-hospitalbag-01',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    type: 'hospital_checklist_item',
    loggedAt: '2026-10-20T14:00:00.000Z',
    payload: {
      item: 'Maternity admission notes & identification',
      category: 'Documentation',
      packed: true,
    },
    isSample: true,
    createdAt: '2026-10-20T14:00:00.000Z',
  },
  {
    id: 'rec-mat-hospitalbag-02',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    type: 'hospital_checklist_item',
    loggedAt: '2026-10-20T14:00:00.000Z',
    payload: {
      item: 'Front-opening comfortable nightwear & warm socks',
      category: 'Clothing',
      packed: true,
    },
    isSample: true,
    createdAt: '2026-10-20T14:00:00.000Z',
  },
];

export const MATERNITY_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-mat-01',
    profileId: MATERNITY_PERSONA_ID,
    journey: 'maternity',
    title: 'Mid-Pregnancy Fetal Anatomy Ultrasound & OGTT',
    date: '2026-11-05',
    time: '09:00',
    startsAt: '2026-11-05T09:00:00.000Z',
    status: 'upcoming',
    payload: {
      title: 'Mid-Pregnancy Fetal Anatomy Ultrasound & OGTT',
      location: 'Maternal-Fetal Imaging Center, Level 2',
      notes: 'Anatomy evaluation, amniotic fluid volume, and oral glucose challenge.',
    },
    notes: 'Anatomy evaluation, amniotic fluid volume, and oral glucose challenge.',
    isSample: true,
    createdAt: '2026-10-10T08:00:00.000Z',
  },
];

// =========================================================================
// Persona 3: Menopause Wellbeing (Elena Rostova, Age 51)
// =========================================================================
export const MENOPAUSE_PERSONA_ID = 'fake-profile-menopause-03';

export const MENOPAUSE_PROFILE: Profile = {
  id: MENOPAUSE_PERSONA_ID,
  nickname: 'Elena (Menopause Demo)',
  displayName: 'Elena Rostova',
  avatar: 'botanical-lavender',
  avatarColor: '#B69BC8',
  activeJourneys: ['menopause'],
  lastActiveJourney: 'menopause',
  activeJourney: 'menopause',
  hasPin: false,
  isSample: true,
  createdAt: '2026-05-10T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENOPAUSE_HEALTH_PROFILE: HealthProfile = {
  profileId: MENOPAUSE_PERSONA_ID,
  journey: 'menopause',
  payload: {
    age: 51,
    dateOfBirth: '1975-08-14',
    height: 162,
    weight: 63,
    conditions: ['Perimenopausal Vasomotor Changes', 'Family history of Osteopenia'],
    allergies: ['Sulfa drugs'],
    medicines: ['Calcium Carbonate 600mg', 'Vitamin D3 2000 IU', 'Magnesium Glycinate'],
  },
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENOPAUSE_JOURNEY_PROFILE: JourneyProfile = {
  id: 'jp-fake-menopause',
  profileId: MENOPAUSE_PERSONA_ID,
  journey: 'menopause',
  status: 'active',
  payload: {
    stage: 'perimenopause',
    goals: [
      'Track vasomotor episodes',
      'Optimize bone and joint health',
      'Improve restorative sleep continuity',
    ],
  },
  createdAt: '2026-05-10T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
};

export const MENOPAUSE_CHECKINS: Checkin[] = [
  {
    id: 'chk-meno-01',
    profileId: MENOPAUSE_PERSONA_ID,
    journey: 'menopause',
    loggedAt: '2026-10-20T07:30:00.000Z',
    payload: {
      symptoms: ['hot_flashes', 'night_sweats', 'sleep_disruption'],
      scores: { hotFlashesCount: 3, sleepQuality: 5, mood: 6 },
      mood: 'fatigued',
      note: 'Woke at 3am with night sweat. Fan helped settle temperature.',
    },
    isSample: true,
    createdAt: '2026-10-20T07:30:00.000Z',
  },
  {
    id: 'chk-meno-02',
    profileId: MENOPAUSE_PERSONA_ID,
    journey: 'menopause',
    loggedAt: '2026-10-22T08:00:00.000Z',
    payload: {
      symptoms: ['hot_flashes', 'brain_fog'],
      scores: { hotFlashesCount: 2, sleepQuality: 7, mood: 7 },
      mood: 'focused',
      note: 'Afternoon mild hot flash during team presentation.',
    },
    isSample: true,
    createdAt: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'chk-meno-03',
    profileId: MENOPAUSE_PERSONA_ID,
    journey: 'menopause',
    loggedAt: '2026-10-25T08:00:00.000Z',
    payload: {
      symptoms: ['night_sweats'],
      scores: { hotFlashesCount: 1, sleepQuality: 8, mood: 8 },
      mood: 'refreshed',
      note: 'Better night after evening meditation and cool bedroom setting.',
    },
    isSample: true,
    createdAt: '2026-10-25T08:00:00.000Z',
  },
];

export const MENOPAUSE_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-meno-01',
    profileId: MENOPAUSE_PERSONA_ID,
    journey: 'menopause',
    title: 'Perimenopause Consultation & Bone Density Scan (DEXA)',
    date: '2026-11-18',
    time: '14:00',
    startsAt: '2026-11-18T14:00:00.000Z',
    status: 'upcoming',
    payload: {
      title: 'Perimenopause Consultation & Bone Density Scan (DEXA)',
      location: 'Metabolic & Endocrinology Center, Building C',
      notes: 'Review vasomotor symptom frequency, bone baseline, and discuss neutral treatment pathways.',
    },
    notes: 'Review vasomotor symptom frequency, bone baseline, and discuss neutral treatment pathways.',
    isSample: true,
    createdAt: '2026-10-05T08:00:00.000Z',
  },
];

// =========================================================================
// Settings & Consents Shared Defaults
// =========================================================================
export function createDefaultSettings(profileId: string): Settings {
  return {
    profileId,
    theme: 'light',
    textSize: 'medium',
    notificationPrefs: {
      appointments: true,
      checkins: true,
      educationalAlerts: true,
    },
    aiEnabled: true,
    analyticsEnabled: false,
    sexualWellbeingVisible: true,
  };
}

export function createDefaultConsents(profileId: string): Consent[] {
  return [
    {
      id: `consent-${profileId}-1`,
      profileId,
      scope: 'local_health_data',
      granted: true,
      policyVersion: '1.0.0',
      grantedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: `consent-${profileId}-2`,
      profileId,
      scope: 'ai_numbers_only',
      granted: true,
      policyVersion: '1.0.0',
      grantedAt: '2026-08-01T00:00:00.000Z',
    },
  ];
}

// =========================================================================
// Composite Fake Dataset Loader
// =========================================================================
export async function seedFakeDatasets(database: FemoraDatabase = db): Promise<{
  menstrualProfileId: string;
  maternityProfileId: string;
  menopauseProfileId: string;
  totalRecordsLoaded: number;
}> {
  let count = 0;

  await database.transaction(
    'rw',
    [
      database.profiles,
      database.healthProfile,
      database.journeyProfiles,
      database.settings,
      database.consents,
      database.checkins,
      database.records,
      database.appointments,
      database.notifications,
    ],
    async () => {
      // 1. Seed Menstrual Persona
      await database.profiles.put(MENSTRUAL_PROFILE); count++;
      await database.healthProfile.put(MENSTRUAL_HEALTH_PROFILE); count++;
      await database.journeyProfiles.put(MENSTRUAL_JOURNEY_PROFILE); count++;
      await database.settings.put(createDefaultSettings(MENSTRUAL_PERSONA_ID)); count++;
      for (const c of createDefaultConsents(MENSTRUAL_PERSONA_ID)) {
        await database.consents.put(c); count++;
      }
      for (const chk of MENSTRUAL_CHECKINS) {
        await database.checkins.put(chk); count++;
      }
      for (const apt of MENSTRUAL_APPOINTMENTS) {
        await database.appointments.put(apt); count++;
      }

      // 2. Seed Maternity Persona
      await database.profiles.put(MATERNITY_PROFILE); count++;
      await database.healthProfile.put(MATERNITY_HEALTH_PROFILE); count++;
      await database.journeyProfiles.put(MATERNITY_JOURNEY_PROFILE); count++;
      await database.settings.put(createDefaultSettings(MATERNITY_PERSONA_ID)); count++;
      for (const c of createDefaultConsents(MATERNITY_PERSONA_ID)) {
        await database.consents.put(c); count++;
      }
      for (const chk of MATERNITY_CHECKINS) {
        await database.checkins.put(chk); count++;
      }
      for (const rec of MATERNITY_RECORDS) {
        await database.records.put(rec); count++;
      }
      for (const apt of MATERNITY_APPOINTMENTS) {
        await database.appointments.put(apt); count++;
      }

      // 3. Seed Menopause Persona
      await database.profiles.put(MENOPAUSE_PROFILE); count++;
      await database.healthProfile.put(MENOPAUSE_HEALTH_PROFILE); count++;
      await database.journeyProfiles.put(MENOPAUSE_JOURNEY_PROFILE); count++;
      await database.settings.put(createDefaultSettings(MENOPAUSE_PERSONA_ID)); count++;
      for (const c of createDefaultConsents(MENOPAUSE_PERSONA_ID)) {
        await database.consents.put(c); count++;
      }
      for (const chk of MENOPAUSE_CHECKINS) {
        await database.checkins.put(chk); count++;
      }
      for (const apt of MENOPAUSE_APPOINTMENTS) {
        await database.appointments.put(apt); count++;
      }
    }
  );

  return {
    menstrualProfileId: MENSTRUAL_PERSONA_ID,
    maternityProfileId: MATERNITY_PERSONA_ID,
    menopauseProfileId: MENOPAUSE_PERSONA_ID,
    totalRecordsLoaded: count,
  };
}
