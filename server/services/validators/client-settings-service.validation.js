const clientSettingsUpdateRules = {
  fileHandling: "object",
  "fileHandling.autoRemoveOldFilesBeforeUpload": "boolean",
  "fileHandling.autoRemoveOldFilesCriteriumDays": "integer|min:0",
};

module.exports = {
  clientSettingsUpdateRules
};
