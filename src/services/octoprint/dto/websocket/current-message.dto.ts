import type { JobDto } from "@/services/octoprint/dto/job/job.dto";
import type { TempsDto } from "@/services/octoprint/dto/printer/temps.dto";
import type { ProgressDto } from "@/services/octoprint/dto/printer/progress.dto";
import type { ResendsDto } from "@/services/octoprint/dto/printer/resends.dto";
import type { StateDto } from "@/services/octoprint/dto/printer/state.dto";
import type { MarkingsDto } from "@/services/octoprint/dto/printer/markings.dto";
import type { BusyFileDto } from "@/services/octoprint/dto/printer/busy-file.dto";

export interface CurrentMessageDto {
  // Printer information
  temps: TempsDto;
  state: StateDto;

  // Job information
  job: JobDto;
  currentZ: number;
  progress: ProgressDto;
  offsets: {};
  resends: ResendsDto;
  serverTime: number;
  busyFiles: BusyFileDto[];
  markings: MarkingsDto[];
  logs: string[];
  messages: string[];
  // 1.10 documents this
  // plugins: any[];
}
