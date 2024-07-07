import { JobDto } from "@/services/octoprint/dto/job/job.dto";
import { TempsDto } from "@/services/octoprint/dto/printer/temps.dto";
import { ProgressDto } from "@/services/octoprint/dto/printer/progress.dto";
import { ResendsDto } from "@/services/octoprint/dto/printer/resends.dto";
import { StateDto } from "@/services/octoprint/dto/printer/state.dto";
import { MarkingsDto } from "@/services/octoprint/dto/printer/markings.dto";
import { BusyFileDto } from "@/services/octoprint/dto/printer/busy-file.dto";
import { OctoPrintEventDto } from "@/services/octoprint/dto/octoprint-event.dto";

// FDM Monster internal event
export type CurrentMessageEvent = OctoPrintEventDto<"current", CurrentMessageDto>;

export interface CurrentMessageDto {
  state: StateDto;
  job: JobDto;
  currentZ: number;
  progress: ProgressDto;
  offsets: {};
  resends: ResendsDto;
  serverTime: number;
  temps: TempsDto;
  busyFiles: BusyFileDto[];
  markings: MarkingsDto[];
  logs: string[];
  messages: string[];
  // 1.10 documents this
  // plugins: any[];
}
