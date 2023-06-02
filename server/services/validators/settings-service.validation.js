const {
  printerFileCleanSettingKey,
  frontendSettingKey,
  serverSettingsKey,
} = require("../../constants/server-settings.constants");

const serverSettingsUpdateRules = {
  registration: "boolean",
  loginRequired: "boolean",
  debugSettings: "object",
  "debugSettings.debugSocketEvents": "boolean",
  "debugSettings.debugSocketReconnect": "boolean",
};

const settingsUpdateRules = {
  [serverSettingsKey]: "object",
  [`${serverSettingsKey}.registration`]: "boolean",
  [`${serverSettingsKey}.loginRequired`]: "boolean",
  [printerFileCleanSettingKey]: "object",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesBeforeUpload`]: "boolean",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesAtBoot`]: "boolean",
  [`${printerFileCleanSettingKey}.autoRemoveOldFilesCriteriumDays`]: "integer|min:0",
};

const frontendSettingsUpdateRules = {
  [frontendSettingKey]: "object",
  [`${frontendSettingKey}.gridCols`]: "integer|min:1",
  [`${frontendSettingKey}.gridRows`]: "integer|min:1",
  [`${frontendSettingKey}.largeTiles`]: "boolean",
};

module.exports = {
  settingsUpdateRules,
  serverSettingsUpdateRules,
  frontendSettingsUpdateRules,
};
