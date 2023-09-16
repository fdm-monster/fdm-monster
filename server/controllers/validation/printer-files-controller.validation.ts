export const getFilesRules = {
  recursive: "required|boolean",
};

export const uploadFileRules = {};

export const getFileRules = {
  path: "required|string",
};

export const createFolderRules = {
  foldername: "required|string",
  path: "required|string",
};

export const moveFileOrFolderRules = {
  filePath: "required|string",
  destination: "required|string",
};

export const fileUploadCommandsRules = {
  select: "boolean",
  print: "required|boolean",
};

export const selectAndPrintFileRules = {
  filePath: "required|string",
  print: "required|boolean",
};

export const localFileUploadRules = {
  localLocation: "required",
  select: "boolean",
  print: "boolean",
};
