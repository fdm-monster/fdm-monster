const getFilesRules = {
  recursive: "required|boolean"
};

const deleteFileRules = {
  path: "optional|in:local,sdcard",
  fullPath: "required"
};

module.exports = {
  getFilesRules,
  deleteFileRules
};
