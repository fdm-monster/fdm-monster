import { Metadata } from "@/services/moonraker/dto/server-history/history-list.dto";

export const jobStates = {
  error: "error",
  in_progress: "in_progress",
  klippy_shutdown: "klippy_shutdown",
};
export const jobStatesList = Object.keys(jobStates);
export type JobState = keyof typeof jobStates;

export interface JobDto {
  // Hex string format "00000C"
  job_id: string;
  // Whether file is present
  exists: boolean;
  end_time: number | null;
  filament_used: number;
  filename: string;
  metadata: Metadata;
  print_duration: number;
  status: JobState;
  start_time: number;
  total_duration: number;
}
