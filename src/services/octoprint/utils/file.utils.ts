import { CreateOrUpdatePrinterFileDto } from "@/services/interfaces/printer-file.dto";
import { OctoPrintCustomDto, OctoprintRawFileDto } from "@/services/octoprint/models/octoprint-file.dto";

export function normalizePrinterFile(file: OctoprintRawFileDto): CreateOrUpdatePrinterFileDto {
  if (!file) {
    throw new Error("File should not be null for normalization");
  }

  const keys = Object.keys(file);
  const fileCopy = {
    ...file,
  };

  const knownKeys = [
    "name",
    "date",
    // "display",
    // "gcodeAnalysis",
    // "hash",
    // "origin",
    "path",
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
