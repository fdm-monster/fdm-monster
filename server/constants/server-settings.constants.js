const { AppConstants } = require("../server.constants");

const getDefaultWhitelistIpAddresses = () => ["::12", "127.0.0.1"];

const serverSettingKey = "server";
const getDefaultServerSettings = () => ({
  port: AppConstants.defaultServerPort,
  uploadFolder: AppConstants.defaultFileStorageFolder,
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
  apiRetryCutoff: 10000,
  apiRetry: 30000,
  webSocketRetry: 5000,
});

const printerFileCleanSettingKey = "printerFileClean";
const getDefaultPrinterFileCleanSettings = () => ({
  autoRemoveOldFilesBeforeUpload: false,
  autoRemoveOldFilesAtBoot: false,
  autoRemoveOldFilesCriteriumDays: 7,
});

const getDefaultSettings = () => ({
  [serverSettingKey]: getDefaultServerSettings(),
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  [frontendSettingKey]: getDefaultFrontendSettings(),
  [timeoutSettingKey]: getDefaultTimeout(),
});

module.exports = {
  serverSettingKey,
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
