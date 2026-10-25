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

interface AppContextValue {
  profiles: LocalProfile[];
  activeProfile: LocalProfile | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  createProfile: (nickname: string) => LocalProfile | null;
  selectProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
    deleteProfile: (profileId: string) => void;
  updateProfileJourney: (
    profileId: string,
    journey: LocalProfile["journey"],
  ) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

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

  function createProfile(nickname: string): LocalProfile | null {
    const cleanNickname = nickname.trim();

    if (!cleanNickname) return null;

    const profile: LocalProfile = {
      id: createId(),
      nickname: cleanNickname.slice(0, 32),
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
  
  function updateProfileJourney(
    profileId: string,
    journey: LocalProfile["journey"],
  ): boolean {
    if (!journey) return false;

    const profileExists = profiles.some(
      (profile) => profile.id === profileId,
    );

    if (!profileExists) return false;

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? { ...profile, journey }
          : profile,
      ),
    );

    return true;
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

  
  const value: AppContextValue = {
    profiles,
    activeProfile,
    theme,
    setTheme,
    createProfile,
    selectProfile,
    clearActiveProfile,
    deleteProfile,
    updateProfileJourney,
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