const getFilesRules = {
  recursive: "required|boolean"
};

const selectPrintFile = {
  fullPath: "required|string",
  print: "required|boolean"
};

const uploadFilesRules = {};

const getFileRules = {
  fullPath: "required|string"
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
  selectPrintFile,
  localFileUploadRules,
  uploadFilesRules,
  fileUploadCommandsRules,
  getFileRules
};
