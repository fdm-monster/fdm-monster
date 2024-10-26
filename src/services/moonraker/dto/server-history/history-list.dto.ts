import { JobDto } from "@/services/moonraker/dto/server-history/job.dto";

export interface HistoryListDto {
  count: number;
  jobs: JobDto[];
}

export interface Metadata {}
