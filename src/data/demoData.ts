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

export const DEMO_PROFILE_ID = 'demo-profile-uuid-0001';

export const DEMO_PROFILE: Profile = {
  id: DEMO_PROFILE_ID,
  nickname: 'Maya (Demo)',
  avatar: 'botanical-sage',
  activeJourneys: ['menstrual', 'maternity', 'menopause'],
  lastActiveJourney: 'menstrual',
  hasPin: false,
  isSample: true,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-10-24T08:00:00.000Z',
};

export const DEMO_HEALTH_PROFILE: HealthProfile = {
  profileId: DEMO_PROFILE_ID,
  payload: {
    conditions: ['Mild Seasonal Allergies'],
    allergies: ['Penicillin'],
    medicines: ['Prenatal Multivitamin', 'Omega-3'],
    age: 31,
    height: 168,
    weight: 64,
  },
  updatedAt: '2026-10-24T08:00:00.000Z',
};

export const DEMO_JOURNEY_PROFILES: JourneyProfile[] = [
  {
    id: 'jp-demo-menstrual',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    status: 'complete',
    payload: {
      typicalCycleLengthDays: 28,
      typicalPeriodLengthDays: 5,
      lastPeriodDate: '2026-10-04T00:00:00.000Z',
    },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
  },
  {
    id: 'jp-demo-maternity',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    status: 'complete',
    payload: {
      status: 'pregnant',
      dueDate: '2026-12-18T00:00:00.000Z',
      pregnancyWeek: 32,
      careProvider: 'St. Jude Midwifery Center',
    },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
  },
  {
    id: 'jp-demo-menopause',
    profileId: DEMO_PROFILE_ID,
    journey: 'menopause',
    status: 'complete',
    payload: {
      stage: 'perimenopause',
      goals: ['Track vasomotor episodes', 'Support bone density', 'Monitor sleep'],
    },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z',
  },
];

export const DEMO_SETTINGS: Settings = {
  profileId: DEMO_PROFILE_ID,
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

export const DEMO_CONSENTS: Consent[] = [
  {
    id: 'consent-demo-1',
    profileId: DEMO_PROFILE_ID,
    scope: 'local_health_data',
    granted: true,
    policyVersion: '1.0.0',
    grantedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'consent-demo-2',
    profileId: DEMO_PROFILE_ID,
    scope: 'ai_numbers_only',
    granted: true,
    policyVersion: '1.0.0',
    grantedAt: '2026-09-01T08:00:00.000Z',
  },
];

export const DEMO_CHECKINS: Checkin[] = [
  // Menstrual Check-ins (Cycle 1 & Cycle 2)
  {
    id: 'chk-demo-m-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    loggedAt: '2026-10-04T09:00:00.000Z',
    payload: {
      symptoms: ['cramps', 'fatigue', 'headache'],
      scores: { pain: 6, mood: 5, sleepHours: 7, energy: 4 },
      mood: 'Tired but coping',
      note: 'Felt uterine cramps upon waking; hot tea helped.',
    },
    isSample: true,
    createdAt: '2026-10-04T09:00:00.000Z',
    updatedAt: '2026-10-04T09:00:00.000Z',
  },
  {
    id: 'chk-demo-m-02',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    loggedAt: '2026-10-05T10:30:00.000Z',
    payload: {
      symptoms: ['cramps', 'bloating'],
      scores: { pain: 4, mood: 6, sleepHours: 8, energy: 6 },
      mood: 'Calm',
      note: 'Flow medium. Cramping softened after a warm shower.',
    },
    isSample: true,
    createdAt: '2026-10-05T10:30:00.000Z',
    updatedAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'chk-demo-m-03',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    loggedAt: '2026-10-18T14:00:00.000Z',
    payload: {
      symptoms: ['breast_tenderness', 'bloating'],
      scores: { pain: 2, mood: 7, sleepHours: 8, energy: 8 },
      mood: 'Energetic',
      note: 'Mid-cycle ovulation window.',
    },
    isSample: true,
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-10-18T14:00:00.000Z',
  },
  // Maternity Check-ins
  {
    id: 'chk-demo-mat-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    loggedAt: '2026-10-10T11:00:00.000Z',
    payload: {
      symptoms: ['fatigue', 'backache', 'edema'],
      scores: { pain: 3, mood: 8, sleepHours: 6.5, energy: 5 },
      mood: 'Excited',
      note: 'Baby kicked actively after breakfast. Mild ankle swelling in evening.',
    },
    isSample: true,
    createdAt: '2026-10-10T11:00:00.000Z',
    updatedAt: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'chk-demo-mat-02',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    loggedAt: '2026-10-20T16:15:00.000Z',
    payload: {
      symptoms: ['heartburn', 'fatigue'],
      scores: { pain: 2, mood: 7, sleepHours: 7, energy: 6 },
      mood: 'Content',
      note: 'Felt slight heartburn after lunch; resting with elevated pillows.',
    },
    isSample: true,
    createdAt: '2026-10-20T16:15:00.000Z',
    updatedAt: '2026-10-20T16:15:00.000Z',
  },
  // Menopause Check-ins
  {
    id: 'chk-demo-men-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'menopause',
    loggedAt: '2026-10-12T07:45:00.000Z',
    payload: {
      symptoms: ['hot_flashes', 'night_sweats', 'insomnia'],
      scores: { pain: 1, mood: 5, sleepHours: 5, energy: 4 },
      mood: 'Disrupted sleep',
      note: 'Woke at 3am feeling hot. Cooled down with open window.',
    },
    isSample: true,
    createdAt: '2026-10-12T07:45:00.000Z',
    updatedAt: '2026-10-12T07:45:00.000Z',
  },
  {
    id: 'chk-demo-men-02',
    profileId: DEMO_PROFILE_ID,
    journey: 'menopause',
    loggedAt: '2026-10-22T08:30:00.000Z',
    payload: {
      symptoms: ['hot_flashes', 'joint_stiffness'],
      scores: { pain: 2, mood: 7, sleepHours: 7, energy: 7 },
      mood: 'Balanced',
      note: 'Joint stiffness cleared after morning stretch.',
    },
    isSample: true,
    createdAt: '2026-10-22T08:30:00.000Z',
    updatedAt: '2026-10-22T08:30:00.000Z',
  },
];

export const DEMO_RECORDS: RecordItem[] = [
  {
    id: 'rec-demo-bp-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    type: 'birth_plan',
    loggedAt: '2026-10-01T10:00:00.000Z',
    payload: {
      preferences: [
        'Dim lighting in delivery room',
        'Delayed cord clamping (at least 60 seconds)',
        'Immediate skin-to-skin contact',
        'Freedom to change positions during first stage',
      ],
      supportPerson: 'Partner present throughout',
    },
    isSample: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'rec-demo-hosp-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    type: 'hospital_checklist_item',
    loggedAt: '2026-10-15T12:00:00.000Z',
    payload: {
      title: 'Maternity pads & nursing bras packed',
      completed: true,
    },
    isSample: true,
    createdAt: '2026-10-15T12:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  },
  {
    id: 'rec-demo-doc-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    type: 'doctor_question',
    loggedAt: '2026-10-22T14:00:00.000Z',
    payload: {
      question: 'When should we schedule the 34-week growth scan?',
      category: 'Ultrasound',
      resolved: false,
    },
    isSample: true,
    createdAt: '2026-10-22T14:00:00.000Z',
    updatedAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'rec-demo-sex-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    type: 'sexual_wellbeing',
    loggedAt: '2026-10-18T20:00:00.000Z',
    payload: {
      comfortScore: 9,
      protectionUsed: true,
      notes: 'No discomfort noted.',
    },
    isSample: true,
    createdAt: '2026-10-18T20:00:00.000Z',
    updatedAt: '2026-10-18T20:00:00.000Z',
  },
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-demo-01',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    startsAt: '2026-11-02T10:00:00.000Z',
    reminderOffsetMinutes: 1440, // 24 hours before
    status: 'upcoming',
    payload: {
      title: '34-Week Antenatal Checkup & Blood Pressure Scan',
      location: 'St. Jude Midwifery Clinic, Room 3B',
      notes: 'Discuss birth preferences and review GBS screening protocol.',
    },
    isSample: true,
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
  },
  {
    id: 'apt-demo-02',
    profileId: DEMO_PROFILE_ID,
    journey: 'menstrual',
    startsAt: '2026-11-15T15:30:00.000Z',
    reminderOffsetMinutes: 120, // 2 hours before
    status: 'upcoming',
    payload: {
      title: 'Annual Gynecological Routine Review',
      location: 'City Wellness Practice',
      notes: 'Bring 3-month cycle summary report.',
    },
    isSample: true,
    createdAt: '2026-10-10T11:00:00.000Z',
    updatedAt: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'apt-demo-03',
    profileId: DEMO_PROFILE_ID,
    journey: 'maternity',
    startsAt: '2026-10-02T11:00:00.000Z',
    reminderOffsetMinutes: 60,
    status: 'done',
    payload: {
      title: '28-Week Glucose Screening & Fundal Height',
      location: 'St. Jude Midwifery Clinic',
      notes: 'Results all normal. Rhogam given.',
    },
    isSample: true,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-10-02T12:00:00.000Z',
  },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-demo-01',
    profileId: DEMO_PROFILE_ID,
    kind: 'appointment_reminder',
    refId: 'apt-demo-01',
    messageKey: 'appointment_upcoming',
    params: {
      title: '34-Week Antenatal Checkup & Blood Pressure Scan',
      daysUntil: 9,
    },
    createdAt: '2026-10-24T08:00:00.000Z',
  },
];
