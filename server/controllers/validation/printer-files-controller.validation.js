const getFilesRules = {
  recursive: "required|boolean"
};

const selectAndPrintFileRules = {
  filePath: "required|string",
  print: "required|boolean"
};

const uploadFilesRules = {};

const getFileRules = {
  path: "required|string"
};

const createFolderRules = {
  foldername: "required|string",
  path: "required|string"
};

const moveFileOrFolderRules = {
  filePath: "required|string",
  destination: "required|string"
};

const fileUploadCommandsRules = {
  select: "boolean",
  print: "boolean"
};

const localFileUploadRules = {
  localLocation: "required",
  select: "boolean",
  print: "boolean"
};

module.exports = {
  getFilesRules,
  selectAndPrintFileRules,
  localFileUploadRules,
  uploadFilesRules,
  createFolderRules,
  moveFileOrFolderRules,
  fileUploadCommandsRules,
  getFileRules
};
