const getFilesRules = {
  location: "required|in:local,sdcard",
  recursive: "required|boolean"
};

const uploadFilesRules = {
  location: "required|in:local,sdcard"
};

const getFileRules = {
  location: "required|in:local,sdcard",
  fullPath: "required|string"
};

const fileUploadCommandsRules = {
  select: "required|boolean",
  print: "required|boolean"
};

module.exports = {
  getFilesRules,
  uploadFilesRules,
  fileUploadCommandsRules,
  getFileRules
};
