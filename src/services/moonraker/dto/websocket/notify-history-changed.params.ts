import type { JobDto } from "@/services/moonraker/dto/server-history/job.dto";

export interface NotifyHistoryChangedParams {
  action: "added" | "finished";
  job: JobDto;
}
