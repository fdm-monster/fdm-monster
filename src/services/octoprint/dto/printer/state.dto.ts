import type { FlagsDto } from "@/services/octoprint/dto/printer/flags.dto";

export interface StateDto {
  text: string;
  flags: FlagsDto;
  error: string;
}
