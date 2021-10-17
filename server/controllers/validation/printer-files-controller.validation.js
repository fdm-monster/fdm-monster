const getFilesRules = {
  recursive: "required|boolean"
};

const selectAndPrintFileRules = {
  filePath: "required|string",
  // select: "required|boolean",
  print: "required|boolean"
};

const uploadFilesRules = {};

const getFileRules = {
  filePath: "required|string"
};

const moveFileRules = {
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
  moveFileRules,
  fileUploadCommandsRules,
  getFileRules
};
