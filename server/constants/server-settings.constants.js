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
  server: getDefaultServerSettings(),
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  timeout: getDefaultTimeout(),
});

module.exports = {
  serverSettingKey,
  getDefaultServerSettings,
  getDefaultTimeout,
  printerFileCleanSettingKey,
  getDefaultWhitelistIpAddresses,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
};
