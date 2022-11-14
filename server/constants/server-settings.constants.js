const { AppConstants } = require("../server.constants");

const server = {
  port: AppConstants.defaultServerPort,
  uploadFolder: AppConstants.defaultFileStorageFolder,
  registration: true,
  loginRequired: false,
};

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
  server,
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  timeout: getDefaultTimeout(),
});

module.exports = {
  server,
  getDefaultTimeout,
  printerFileCleanSettingKey,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
};
