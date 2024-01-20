import { GcodeAnalysisDto } from "@/services/interfaces/gcode-analysis.dto";
import { OctoPrintStatisticsDto, Prints, Refs } from "@/services/interfaces/printer-file.dto";

export interface DisplayLayerProgressDto {
  // numberstring
  totalLayerCountWithoutOffset: string;
}

export interface OctoPrintCustomDto {
  // Custom metadata that is updated on hash changes only
  userdata?: any;

  // Optional parts due to plugins and such
  displayLayerProgress?: DisplayLayerProgressDto;
  thumbnail?: string;
  thumbnail_src?: string;
  [k: string]: any;
}

export interface OctoprintRawFileDto extends OctoPrintCustomDto {
  date: number;
  display: string;
  hash: string;
  name: string;
  origin: "local" | "sd";
  path: string;
  prints: Prints;
  refs: Refs;
  size: number;
  statistics: OctoPrintStatisticsDto;
  type: "machinecode" | "folder";
  typePath: ["machinecode", "gcode"];

  // Default but optional parts
  gcodeAnalysis?: GcodeAnalysisDto;
}

export interface OctoprintRawFilesResponseDto {
  files: OctoprintRawFileDto[];
  free: number;
  used: number;
}
