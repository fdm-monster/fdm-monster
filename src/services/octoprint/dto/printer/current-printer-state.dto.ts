import type { TempsDto } from "@/services/octoprint/dto/printer/temps.dto";
import type { StateDto } from "@/services/octoprint/dto/printer/state.dto";

export interface CurrentPrinterStateDto {
  temperature: TempsDto;
  state: StateDto;
  sd: {
    ready: boolean;
  };
}
