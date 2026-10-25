import Dexie, { Table } from 'dexie';
import {
  Profile,
  HealthProfile,
  JourneyProfile,
  Checkin,
  RecordItem,
  Appointment,
  AppNotification,
  Bookmark,
  RecentlyViewed,
  Consent,
  Settings,
} from '../types';

export class FemoraDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  healthProfile!: Table<HealthProfile, string>;
  journeyProfiles!: Table<JourneyProfile, string>;
  checkins!: Table<Checkin, string>;
  records!: Table<RecordItem, string>;
  appointments!: Table<Appointment, string>;
  notifications!: Table<AppNotification, string>;
  bookmarks!: Table<Bookmark, string>;
  recentlyViewed!: Table<RecentlyViewed, string>;
  consents!: Table<Consent, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('FemoraDB');

    this.version(1).stores({
      profiles: 'id, nickname, isSample, createdAt',
      healthProfile: 'profileId, updatedAt',
      journeyProfiles: 'id, [profileId+journey], profileId, journey',
      checkins:
        'id, [profileId+journey+loggedAt], [profileId+loggedAt], profileId, journey, loggedAt, isSample',
      records:
        'id, [profileId+journey+type+loggedAt], [profileId+type], profileId, journey, type, loggedAt, isSample',
      appointments:
        'id, [profileId+startsAt], profileId, startsAt, status, isSample',
      notifications:
        'id, [profileId+createdAt], profileId, kind, createdAt, readAt',
      bookmarks: 'id, profileId, topicId, createdAt',
      recentlyViewed: 'id, profileId, topicId, viewedAt',
      consents: 'id, [profileId+scope], profileId, scope',
      settings: 'profileId',
    });
  }
}

export const db = new FemoraDatabase();
