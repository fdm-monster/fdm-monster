const { printerFileCleanSettingKey } = require("../../constants/server-settings.constants");
const serverSettingsUpdateRules = {
  server: "object",
  "server.registration": "boolean",
  "server.loginRequired": "boolean",
  [printerFileCleanSettingKey]: "object",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesBeforeUpload`]: "boolean",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesCriteriumDays`]: "integer|min:0",
};

module.exports = {
  serverSettingsUpdateRules
};
