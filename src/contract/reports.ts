import type { Journey } from "../types";

export interface ReportRequest {
  profileId: string;
  journey: Journey;
  startDate: string;
  endDate: string;
}

export interface ReportContract {
  buildReport(request: ReportRequest): Promise<Blob>;
}