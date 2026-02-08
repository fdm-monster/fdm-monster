import type { OctoprintFileDto } from "@/services/octoprint/dto/files/octoprint-file.dto";

export interface OctoprintFilesResponseDto {
  files: OctoprintFileDto[];
  free: number;
  used: number;
}
