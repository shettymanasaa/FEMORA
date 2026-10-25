import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

interface AppContextValue {
  profiles: LocalProfile[];
  activeProfile: LocalProfile | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  createProfile: (nickname: string, journey?: "menstrual" | "maternity" | "menopause") => LocalProfile | null;
  selectProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
  deleteProfile: (profileId: string) => void;
  loadDemoProfiles: () => Promise<void>;
  loginAsDemoPersona: (persona: "menstrual" | "maternity" | "menopause") => Promise<LocalProfile>;
}

const AppContext = createContext<AppContextValue | null>(null);

export { DEFAULT_DEMO_PROFILES };

export function AppProviders({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<LocalProfile[]>(() =>
    readLocalJson<LocalProfile[]>(STORAGE_KEYS.profiles, []),
  );

  const [activeProfileId, setActiveProfileId] = useState<string | null>(() =>
    readLocalJson<string | null>(STORAGE_KEYS.activeProfile, null),
  );

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    writeLocalJson(STORAGE_KEYS.profiles, profiles);
  }, [profiles]);

  useEffect(() => {
    writeLocalJson(STORAGE_KEYS.activeProfile, activeProfileId);
  }, [activeProfileId]);

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

    return profile;
  }

  function selectProfile(profileId: string) {
    if (profiles.some((profile) => profile.id === profileId)) {
      setActiveProfileId(profileId);
    }
  }

  function clearActiveProfile() {
    setActiveProfileId(null);
  }

  function deleteProfile(profileId: string) {
    const confirmed = window.confirm(
      "Delete this local profile? This cannot be undone. Make a backup first if you need these records.",
    );

    if (!confirmed) return;

    setProfiles((current) =>
      current.filter((profile) => profile.id !== profileId),
    );

    if (activeProfileId === profileId) {
      setActiveProfileId(null);
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
