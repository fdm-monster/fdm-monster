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

module.exports = {
  getFilesRules,
  uploadFilesRules,
  getFileRules
};
