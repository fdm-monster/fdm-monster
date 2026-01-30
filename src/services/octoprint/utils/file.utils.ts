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

  return {
    path: fileCopy.path,
    size: fileCopy.size,
    date: fileCopy.date,
    dir: fileCopy.type === 'folder',
  };
}

export function flattenOctoPrintFiles(items: OctoprintFileDto[], parentPath: string = ''): FileDto[] {
  const files: FileDto[] = [];

  for (const item of items) {
    const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;

    if (item.type === 'folder') {
      files.push({
        path: fullPath,
        size: 0,
        date: item.date || null,
        dir: true,
      });

      if (item.children) {
        files.push(...flattenOctoPrintFiles(item.children, fullPath));
      }
    } else if (item.type === 'machinecode') {
      files.push({
        path: fullPath,
        size: item.size,
        date: item.date,
        dir: false,
      });
    }
  }

  return files;
}
