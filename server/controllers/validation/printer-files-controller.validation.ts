const getFilesRules = {
  recursive: "required|boolean",
};

const uploadFileRules = {};

const getFileRules = {
  path: "required|string",
};

const createFolderRules = {
  foldername: "required|string",
  path: "required|string",
};

const moveFileOrFolderRules = {
  filePath: "required|string",
  destination: "required|string",
};

const fileUploadCommandsRules = {
  select: "boolean",
  print: "required|boolean",
};

const selectAndPrintFileRules = {
  filePath: "required|string",
  print: "required|boolean",
};

const localFileUploadRules = {
  localLocation: "required",
  select: "boolean",
  print: "boolean",
};

module.exports = {
  getFilesRules,
  selectAndPrintFileRules,
  localFileUploadRules,
  uploadFileRules,
  createFolderRules,
  moveFileOrFolderRules,
  fileUploadCommandsRules,
  getFileRules,
};
