import type { LocalProfile } from "../types";

export interface ProfileContract {
  listProfiles(): Promise<LocalProfile[]>;
  createProfile(
    input: Pick<LocalProfile, "nickname" | "avatarColor">,
  ): Promise<LocalProfile>;
  setActiveProfile(profileId: string): Promise<void>;
  getActiveProfile(): Promise<LocalProfile | null>;
  deleteProfile(profileId: string): Promise<void>;
}