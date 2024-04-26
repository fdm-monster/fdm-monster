import { JobDto } from "@/services/moonraker/dto/server-history/history-list.dto";

export interface NotifyHistoryChangedParams {
  action: "added" | "finished";
  job: JobDto;
}
