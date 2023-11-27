export function getFileListDefault() {
  return {
    files: [],
    folders: [],
    free: 0,
    total: 0,
  };
}

export function getDefaultPrinterEntry() {
  return {
    fileList: getFileListDefault(),
  };
}

export const UUID_LENGTH = 32;
export const minFloorNameLength = 3;
