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

/**
 * Recursively flattens OctoPrint's nested file structure into a flat array of files.
 * When recursive=true, OctoPrint returns folders with children arrays that need to be traversed.
 *
 * @param items - Array of OctoPrint file/folder items
 * @param parentPath - Parent folder path for constructing full paths
 * @returns Flat array of FileDto objects with full paths
 */
export function flattenOctoPrintFiles(items: OctoprintFileDto[], parentPath: string = ''): FileDto[] {
  const files: FileDto[] = [];

  for (const item of items) {
    if (item.type === 'folder' && item.children) {
      const folderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      files.push(...flattenOctoPrintFiles(item.children, folderPath));
    } else if (item.type === 'machinecode' && item.date) {
      const normalizedFile = normalizePrinterFile(item);
      files.push(normalizedFile);
    }
  }

  return files;
}
