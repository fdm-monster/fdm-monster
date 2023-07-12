const { AppConstants } = require("../server.constants");

const getDefaultWhitelistIpAddresses = () => ["::12", "127.0.0.1"];

const serverSettingsKey = "server";
const getDefaultServerSettings = () => ({
  debugSettings: {
    debugSocketIoEvents: false,
    debugSocketReconnect: false,
    debugSocketRetries: false,
    debugSocketSetup: false,
    debugSocketMessages: false,
    debugSocketIoBandwidth: false,
  },
  registration: true,
  whitelistEnabled: false,
  whitelistedIpAddresses: getDefaultWhitelistIpAddresses(),
  loginRequired: false,
});

const frontendSettingKey = "frontend";
const getDefaultFrontendSettings = () => ({
  gridCols: 8,
  gridRows: 8,
  largeTiles: false,
});

const timeoutSettingKey = "timeout";
const getDefaultTimeout = () => ({
  apiTimeout: 1000,
});

const printerFileCleanSettingKey = "printerFileClean";
const getDefaultPrinterFileCleanSettings = () => ({
  autoRemoveOldFilesBeforeUpload: false,
  autoRemoveOldFilesAtBoot: false,
  autoRemoveOldFilesCriteriumDays: 7,
});

const getDefaultSettings = () => ({
  [serverSettingsKey]: getDefaultServerSettings(),
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  [frontendSettingKey]: getDefaultFrontendSettings(),
  [timeoutSettingKey]: getDefaultTimeout(),
});

module.exports = {
  serverSettingsKey,
  getDefaultServerSettings,
  timeoutSettingKey,
  getDefaultTimeout,
  frontendSettingKey,
  getDefaultFrontendSettings,
  printerFileCleanSettingKey,
  getDefaultWhitelistIpAddresses,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
};
