const getFilesRules = {
  location: "required|in:local,sdcard",
  recursive: "required|boolean"
};

const selectPrintFile = {
  location: "required|in:local,sdcard",
  fullPath: "required|string",
  print: "required|boolean"
};

const uploadFilesRules = {
  location: "required|in:local,sdcard"
};

const getFileRules = {
  location: "required|in:local,sdcard",
  fullPath: "required|string"
};

const fileUploadCommandsRules = {
  select: "boolean",
  print: "boolean"
};

module.exports = {
  getFilesRules,
  selectPrintFile,
  uploadFilesRules,
  fileUploadCommandsRules,
  getFileRules
};
