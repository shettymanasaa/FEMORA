import { db, FemoraDatabase } from './db';
import {
  DEMO_PROFILE,
  DEMO_HEALTH_PROFILE,
  DEMO_JOURNEY_PROFILES,
  DEMO_SETTINGS,
  DEMO_CONSENTS,
  DEMO_CHECKINS,
  DEMO_RECORDS,
  DEMO_APPOINTMENTS,
  DEMO_NOTIFICATIONS,
  DEMO_PROFILE_ID,
} from './demoData';
import { Profile, Result } from '../types';

/**
 * Loads deterministic synthetic demo data into the local Dexie database.
 * Every sample row is marked with `isSample: true`.
 * Does not bypass data validation.
 */
export async function loadDemoData(
  database: FemoraDatabase = db
): Promise<Result<Profile>> {
  try {
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
        // Upsert Profile
        await database.profiles.put(DEMO_PROFILE);
        await database.healthProfile.put(DEMO_HEALTH_PROFILE);

        // Journey Profiles
        for (const jp of DEMO_JOURNEY_PROFILES) {
          await database.journeyProfiles.put(jp);
        }

        // Settings & Consents
        await database.settings.put(DEMO_SETTINGS);
        for (const c of DEMO_CONSENTS) {
          await database.consents.put(c);
        }

        // Checkins
        for (const chk of DEMO_CHECKINS) {
          await database.checkins.put(chk);
        }

        // Records
        for (const rec of DEMO_RECORDS) {
          await database.records.put(rec);
        }

        // Appointments
        for (const apt of DEMO_APPOINTMENTS) {
          await database.appointments.put(apt);
        }

        // Notifications
        for (const notif of DEMO_NOTIFICATIONS) {
          await database.notifications.put(notif);
        }
      }
    );

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('femora_active_profile_id', DEMO_PROFILE_ID);
    }

    return { ok: true, data: DEMO_PROFILE };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to load demo dataset: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/**
 * Clears and resets the demo dataset back to its deterministic initial state.
 * Real user records (where isSample !== true) are strictly untouched!
 */
export async function resetDemoData(
  database: FemoraDatabase = db
): Promise<Result<Profile>> {
  try {
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
        // Remove only sample rows for demo profile
        await database.profiles.delete(DEMO_PROFILE_ID);
        await database.healthProfile.delete(DEMO_PROFILE_ID);
        await database.settings.delete(DEMO_PROFILE_ID);

        await database.journeyProfiles
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.consents
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.checkins
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.records
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.appointments
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.notifications
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();
      }
    );

    // Re-seed with fresh deterministic dataset
    return await loadDemoData(database);
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to reset demo dataset: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/**
 * Completely wipes all sample data from database.
 */
export async function wipeDemoData(
  database: FemoraDatabase = db
): Promise<Result<boolean>> {
  try {
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
        await database.profiles.delete(DEMO_PROFILE_ID);
        await database.healthProfile.delete(DEMO_PROFILE_ID);
        await database.settings.delete(DEMO_PROFILE_ID);

        await database.journeyProfiles
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.consents
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.checkins
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.records
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.appointments
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();

        await database.notifications
          .where('profileId')
          .equals(DEMO_PROFILE_ID)
          .delete();
      }
    );

    return { ok: true, data: true };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to wipe demo dataset: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/**
 * Checks whether the synthetic demo profile currently exists in database.
 */
export async function isDemoLoaded(
  database: FemoraDatabase = db
): Promise<boolean> {
  const profile = await database.profiles.get(DEMO_PROFILE_ID);
  return Boolean(profile && profile.isSample);
}
