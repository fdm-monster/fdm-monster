import { CreateOrUpdatePrinterFileDto } from "@/services/interfaces/printer-file.dto";
import { OctoPrintCustomDto, OctoprintFileDto } from "@/services/octoprint/dto/files/octoprint-file.dto";
import { FileDto } from "@/services/printer-api.interface";

export function normalizePrinterFile(file: OctoprintFileDto): FileDto {
  if (!file) {
    throw new Error("File should not be null for normalization");
  }

  const keys = Object.keys(file);
  const fileCopy = {
    ...file,
  };

  const knownKeys = [
    "path",
    "date",
    "hash",
    // "display",
    // "gcodeAnalysis",
    // "origin",
    // "name",
    // "prints",
    // "refs",
    "size",
    // "statistics",
    // "type",
    // "typePath",
  ];

  const unknownKeys = keys.filter((k) => !knownKeys.includes(k));

  const customData: OctoPrintCustomDto = {};
  for (const unknownKey of unknownKeys) {
    customData[unknownKey] = fileCopy[unknownKey];
    delete fileCopy[unknownKey];
  }

  fileCopy.customData = customData;

  return fileCopy;
}
