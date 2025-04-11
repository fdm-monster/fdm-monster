import { StateDto } from "@/services/octoprint/dto/printer/state.dto";
import { JobDto } from "@/services/octoprint/dto/job/job.dto";
import { TempsDto } from "@/services/octoprint/dto/printer/temps.dto";
import { ProgressDto } from "@/services/octoprint/dto/printer/progress.dto";
import { ResendsDto } from "@/services/octoprint/dto/printer/resends.dto";
import { MarkingsDto } from "@/services/octoprint/dto/printer/markings.dto";
import { BusyFileDto } from "@/services/octoprint/dto/printer/busy-file.dto";

export interface HistoryMessageDto {
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
  plugins: any[];
}

export type HistoryMessageDtoWithoutLogsMessagesPluginsAndTemps = Omit<HistoryMessageDto, 'logs' | 'messages' | 'temps' | 'plugins'>;
