const { printerFileCleanSettingKey, frontendSettingKey } = require("../../constants/server-settings.constants");
const serverSettingsUpdateRules = {
  server: "object",
  "server.registration": "boolean",
  "server.loginRequired": "boolean",
  [printerFileCleanSettingKey]: "object",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesBeforeUpload`]: "boolean",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesAtBoot`]: "boolean",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesCriteriumDays`]: "integer|min:0",
};

const frontendSettingsUpdateRules = {
  [frontendSettingKey]: "object",
  "frontend.gridCols": "integer|min:1",
  "frontend.gridRows": "integer|min:1",
  "frontend.largeTiles": "boolean",
};

module.exports = {
  serverSettingsUpdateRules,
  frontendSettingsUpdateRules,
};
