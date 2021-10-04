const getFilesRules = {
  recursive: "required|boolean"
};

const deleteFileRules = {
  path: "in:local,sdcard",
  fullPath: "required"
};

module.exports = {
  getFilesRules,
  deleteFileRules
};
