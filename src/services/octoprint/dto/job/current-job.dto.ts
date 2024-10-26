import { JobDto } from "@/services/octoprint/dto/job/job.dto";
import { ProgressDto } from "@/services/octoprint/dto/printer/progress.dto";
import { ConnectionState } from "@/services/octoprint/dto/connection/connection-state.type";

export class CurrentJobDto {
  job?: JobDto;
  progress?: ProgressDto;
  state: ConnectionState;
}
