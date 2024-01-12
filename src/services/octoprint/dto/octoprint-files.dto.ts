import { OctoPrintFileDto } from "@/octoprint/dto/octoprint-file.dto";

export class OctoPrintFilesDto {
  files: OctoPrintFileDto[];
  free: number;
  total: number;
}
