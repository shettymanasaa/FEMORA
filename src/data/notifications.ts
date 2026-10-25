import { db, FemoraDatabase } from './db';
import { AppNotification, Appointment, Result } from '../types';

/**
 * Evaluates upcoming locally saved appointments and generates in-app reminders.
 * Runs on application open.
 * Guarantees:
 * 1. Strictly in-app only: No external push, SMS, email, or background daemons.
 * 2. Idempotent: Avoids duplicate notifications on repeated app launches.
 * 3. Respects appointment status: Ignores 'done' or 'cancelled' appointments.
 * 4. Privacy: Stores messageKeys and timing parameters; never stores sensitive health notes.
 */
export async function generateNotifications(
  profileId: string,
  database: FemoraDatabase = db
): Promise<Result<AppNotification[]>> {
  try {
    // 1. Check user notification preferences
    const settings = await database.settings.get(profileId);
    if (settings && settings.notificationPrefs?.appointments === false) {
      const existing = await database.notifications
        .where('profileId')
        .equals(profileId)
        .toArray();
      return { ok: true, data: existing };
    }

    // 2. Fetch all upcoming appointments for this profile
    const appointments = await database.appointments
      .where('profileId')
      .equals(profileId)
      .toArray();

    const now = new Date();
    const upcomingAppointments = appointments.filter((apt) => {
      if (apt.status !== 'upcoming' || !apt.startsAt) return false;
      const aptDate = new Date(apt.startsAt);
      return aptDate.getTime() > now.getTime();
    });

    // 3. Fetch existing notifications to prevent duplicates
    const existingNotifications = await database.notifications
      .where('profileId')
      .equals(profileId)
      .toArray();

    const existingRefIds = new Set(
      existingNotifications
        .filter((n) => n.kind === 'appointment_reminder' && n.refId)
        .map((n) => n.refId)
    );

    const newlyCreated: AppNotification[] = [];

    for (const apt of upcomingAppointments) {
      if (existingRefIds.has(apt.id)) {
        continue; // Already notified!
      }

      const aptStartsAt = apt.startsAt || '';
      const aptTime = new Date(aptStartsAt).getTime();
      const diffMs = aptTime - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = Math.ceil(diffHours / 24);

      // Trigger if within next 7 days or offset
      if (diffDays <= 7) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          profileId,
          kind: 'appointment_reminder',
          refId: apt.id,
          messageKey: 'appointment_upcoming',
          params: {
            title: apt.payload?.title || apt.title || 'Appointment',
            daysUntil: diffDays,
          },
          createdAt: new Date().toISOString(),
        };

        await database.notifications.add(notif);
        newlyCreated.push(notif);
      }
    }

    const allCurrent = await database.notifications
      .where('profileId')
      .equals(profileId)
      .reverse()
      .sortBy('createdAt');

    return { ok: true, data: allCurrent };
  } catch (err: unknown) {
    return {
      ok: false,
      code: 'UNKNOWN',
      message: `Failed to generate notifications: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}
