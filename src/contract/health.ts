import type { CheckInSummary, Journey } from "../types";

export interface HealthContract {
  listCheckIns(
    profileId: string,
    journey: Journey,
  ): Promise<CheckInSummary[]>;

  saveCheckIn(
    profileId: string,
    checkIn: CheckInSummary,
  ): Promise<void>;
}