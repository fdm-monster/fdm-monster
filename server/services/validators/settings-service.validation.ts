const { frontendSettingKey, credentialSettingsKey } = require("../../constants/server-settings.constants");

const serverSettingsUpdateRules = {
  registration: "boolean",
  loginRequired: "boolean",
  debugSettings: "object",
  "debugSettings.debugSocketEvents": "boolean",
  "debugSettings.debugSocketReconnect": "boolean",
};

const frontendSettingsUpdateRules = {
  [frontendSettingKey]: "object",
  [`${frontendSettingKey}.gridCols`]: "integer|min:1",
  [`${frontendSettingKey}.gridRows`]: "integer|min:1",
  [`${frontendSettingKey}.largeTiles`]: "boolean",
};

const credentialSettingUpdateRules = {
  [credentialSettingsKey]: "object",
  [`${credentialSettingsKey}.jwtSecret`]: "required|string",
  [`${credentialSettingsKey}.jwtExpiresIn`]: "required|integer|min:120",
  [`${credentialSettingsKey}.refreshTokenAttempts`]: "required|integer|min:-1",
  [`${credentialSettingsKey}.refreshTokenExpiry`]: "required|integer|min:0",
};

module.exports = {
  serverSettingsUpdateRules,
  frontendSettingsUpdateRules,
  credentialSettingUpdateRules,
};
