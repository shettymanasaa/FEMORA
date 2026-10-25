import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LocalProfile, Theme } from "../types";
import { STORAGE_KEYS } from "../lib/constants";
import { createId, readLocalJson, writeLocalJson } from "../lib/utils";
import { useTheme } from "../hooks/useTheme";
import {
  seedFakeDatasets,
  MENSTRUAL_PERSONA_ID,
  MATERNITY_PERSONA_ID,
  MENOPAUSE_PERSONA_ID,
  DEFAULT_DEMO_PROFILES,
} from "../data/fakeDatasets";
import { db } from "../data/db";
import { coreApi } from "../data/public";
import { db as coreDb, CoreError } from "../data/access";
import { settingsInputSchema } from "../contract/schemas";
import type { Settings } from "../core/contracts";

export interface AppContextValue {
  profiles: LocalProfile[];
  activeProfile: LocalProfile | null;
  syncError: string | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  createProfile: (nickname: string, journey?: "menstrual" | "maternity" | "menopause") => LocalProfile | null;
  selectProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
  deleteProfile: (profileId: string) => Promise<void>;
  loadDemoProfiles: () => Promise<void>;
  loginAsDemoPersona: (persona: "menstrual" | "maternity" | "menopause") => Promise<LocalProfile>;
}

const AppContext = createContext<AppContextValue | null>(null);

export { DEFAULT_DEMO_PROFILES };

// Standardized list of Core Engine child tables for scoped profile data operations
const CORE_CHILD_TABLES = [
  coreDb.healthProfile,
  coreDb.journeyProfiles,
  coreDb.checkins,
  coreDb.records,
  coreDb.appointments,
  coreDb.notifications,
  coreDb.bookmarks,
  coreDb.recentlyViewed,
  coreDb.consents,
  coreDb.settings,
];

/**
 * Safely ensure a profile and its standard settings exist in coreDb.
 * Standardizes settings record IDs as `settings-${profileId}` according to schema.
 * Checks for existing records before creating settings to avoid duplicates.
 * Safely repairs missing or invalid settings without overwriting configured credentials.
 */
export async function ensureProfileAndSettingsInCoreDb(profile: LocalProfile): Promise<void> {
  const now = new Date().toISOString();

  // 1. Ensure profile entry exists
  const existingProfile = await coreDb.profiles.get(profile.id);
  if (!existingProfile) {
    await coreDb.profiles.put({
      id: profile.id,
      profileId: profile.id,
      displayName: profile.nickname,
      activeJourney: profile.journey,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    });
  }

  // 2. Check for existing settings before creating to avoid duplicates
  const existingSetting = await coreDb.settings
    .where("profileId")
    .equals(profile.id)
    .first();

  if (!existingSetting) {
    // Missing settings: create standard schema-valid settings record
    const standardSetting: Settings = {
      id: `settings-${profile.id}`,
      profileId: profile.id,
      pinEnabled: false,
      lockAfterMs: 300000,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    const validated = settingsInputSchema.safeParse(standardSetting);
    if (validated.success) {
      await coreDb.settings.put(validated.data as Settings);
    }
  } else if (!settingsInputSchema.safeParse(existingSetting).success) {
    // Repair corrupted settings safely while preserving existing ID and timestamps
    const repairedSetting: Settings = {
      id: existingSetting.id || `settings-${profile.id}`,
      profileId: profile.id,
      pinEnabled: false,
      lockAfterMs: 300000,
      createdAt: existingSetting.createdAt || now,
      updatedAt: now,
    };

    const validated = settingsInputSchema.safeParse(repairedSetting);
    if (validated.success) {
      await coreDb.settings.put(validated.data as Settings);
    }
  }
}

/**
 * Maps synchronization errors to safe, user-facing descriptions.
 * Avoids exposing sensitive health information or raw payloads in error messages.
 */
export function sanitizeSyncErrorMessage(err: unknown): string {
  if (err instanceof CoreError) {
    switch (err.code) {
      case "LOCKED":
        return "Profile session is locked or currently in use.";
      case "NOT_FOUND":
        return "The requested profile was not found in storage.";
      case "STORAGE_FULL":
        return "Device storage limit reached. Please clear space.";
      case "VALIDATION":
        return "Profile data format is invalid.";
      case "CONFLICT":
        return "A storage conflict occurred for this profile.";
      default:
        return "A storage synchronization error occurred.";
    }
  }
  return "Unable to synchronize profile session. Please try again.";
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<LocalProfile[]>(() =>
    readLocalJson<LocalProfile[]>(STORAGE_KEYS.profiles, []),
  );

  const [activeProfileId, setActiveProfileId] = useState<string | null>(() =>
    readLocalJson<string | null>(STORAGE_KEYS.activeProfile, null),
  );

  const [syncError, setSyncError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  // Monotonic sequence number to prevent asynchronous race conditions during rapid profile switching
  const selectionSeqRef = useRef<number>(0);

  useEffect(() => {
    writeLocalJson(STORAGE_KEYS.profiles, profiles);
  }, [profiles]);

  useEffect(() => {
    writeLocalJson(STORAGE_KEYS.activeProfile, activeProfileId);

    if (!activeProfileId) {
      setSyncError(null);
      return;
    }

    const currentSeq = ++selectionSeqRef.current;

    const performSync = async () => {
      try {
        const found = profiles.find((p) => p.id === activeProfileId);
        if (found) {
          await ensureProfileAndSettingsInCoreDb(found);
        }

        // Drop out if a newer profile selection started while awaiting DB operations
        if (selectionSeqRef.current !== currentSeq) {
          return;
        }

        const selectRes = await coreApi.selectProfile(activeProfileId);

        // Drop out if a newer profile selection started while activating in Core Engine
        if (selectionSeqRef.current !== currentSeq) {
          return;
        }

        if (!selectRes.ok) {
          setSyncError(sanitizeSyncErrorMessage(new CoreError(selectRes.code as any, selectRes.message)));
        } else {
          setSyncError(null);
        }
      } catch (err) {
        if (selectionSeqRef.current === currentSeq) {
          setSyncError(sanitizeSyncErrorMessage(err));
        }
      }
    };

    performSync();
  }, [activeProfileId, profiles]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );

  function createProfile(
    nickname: string,
    journey?: "menstrual" | "maternity" | "menopause"
  ): LocalProfile | null {
    const cleanNickname = nickname.trim();

    if (!cleanNickname) return null;

    const profile: LocalProfile = {
      id: createId(),
      nickname: cleanNickname.slice(0, 32),
      journey,
      avatarColor: ["#C77D88", "#8C9B83", "#B69BC8", "#D2A56F"][
        profiles.length % 4
      ],
      createdAt: new Date().toISOString(),
    };

    setProfiles((current) => [...current, profile]);
    setActiveProfileId(profile.id);

    // Synchronize to Core Engine immediately
    ensureProfileAndSettingsInCoreDb(profile)
      .then(() => coreApi.selectProfile(profile.id))
      .then((res) => {
        if (res && !res.ok) {
          setSyncError(sanitizeSyncErrorMessage(new CoreError(res.code as any, res.message)));
        } else {
          setSyncError(null);
        }
      })
      .catch((err) => {
        setSyncError(sanitizeSyncErrorMessage(err));
      });

    return profile;
  }

  function selectProfile(profileId: string) {
    if (profiles.some((profile) => profile.id === profileId)) {
      setActiveProfileId(profileId);
    }
  }

  function clearActiveProfile() {
    selectionSeqRef.current++;
    setActiveProfileId(null);
    setSyncError(null);
  }

  async function deleteProfile(profileId: string) {
    if (!profileId || typeof profileId !== "string") return;

    // Verify profile exists before attempting deletion
    const targetProfile = profiles.find((p) => p.id === profileId);
    if (!targetProfile) return;

    // Remove from local profiles state
    setProfiles((current) => current.filter((p) => p.id !== profileId));

    try {
      if (activeProfileId === profileId) {
        // Active profile deletion: increment sequence to invalidate any pending sync
        selectionSeqRef.current++;
        setActiveProfileId(null);
        await coreApi.deleteProfile(profileId);
      } else {
        // Background profile deletion: Clean up ONLY the target profile's data
        await coreDb.transaction("rw", [coreDb.profiles, ...CORE_CHILD_TABLES], async () => {
          for (const table of CORE_CHILD_TABLES) {
            await table.where("profileId").equals(profileId).delete();
          }
          await coreDb.profiles.delete(profileId);
        });
      }

      // Also clean up legacy appDb entries if present
      await db.profiles.delete(profileId).catch(() => {});
      await db.checkins.where("profileId").equals(profileId).delete().catch(() => {});

      setSyncError(null);
    } catch (err) {
      setSyncError(sanitizeSyncErrorMessage(err));
    }
  }

  async function loadDemoProfiles() {
    // 1. Seed IndexedDB with all clinical records, check-ins, birth plans, and appointments
    await seedFakeDatasets(db);

    // 2. Merge demo profiles into local profile state
    setProfiles((current) => {
      const existingIds = new Set(current.map((p) => p.id));
      const missing = DEFAULT_DEMO_PROFILES.filter((p) => !existingIds.has(p.id));
      return [...current, ...missing];
    });

    if (!activeProfileId) {
      setActiveProfileId(MENSTRUAL_PERSONA_ID);
    }
  }

  async function loginAsDemoPersona(persona: "menstrual" | "maternity" | "menopause"): Promise<LocalProfile> {
    await seedFakeDatasets(db);

    const target = DEFAULT_DEMO_PROFILES.find((p) => p.journey === persona) || DEFAULT_DEMO_PROFILES[0];

    setProfiles((current) => {
      if (current.some((p) => p.id === target.id)) return current;
      return [...current, target];
    });

    setActiveProfileId(target.id);
    return target;
  }

  const value: AppContextValue = {
    profiles,
    activeProfile,
    syncError,
    theme,
    setTheme,
    createProfile,
    selectProfile,
    clearActiveProfile,
    deleteProfile,
    loadDemoProfiles,
    loginAsDemoPersona,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProviders");
  }

  return context;
}
