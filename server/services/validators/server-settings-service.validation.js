const serverSettingsUpdateRules = {
  server: "required|object",
  "server.registration": "required|boolean",
  "server.loginRequired": "required|boolean",
  fileHandling: "object",
  "fileHandling.autoRemoveOldFilesBeforeUpload": "boolean",
  "fileHandling.autoRemoveOldFilesCriteriumDays": "integer|min:0",
};

module.exports = {
  serverSettingsUpdateRules
};
