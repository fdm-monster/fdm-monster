const { AppConstants } = require("../server.constants");

// Default Settings
const onlinePolling = {
  seconds: 0.5,
};

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

const HISTORY_SETTINGS = {
  snapshot: "snapshot",
  thumbnails: "thumbnails",
  timelapse: "timelapse",
};

const history = {
  [HISTORY_SETTINGS.snapshot]: {
    onFailure: true,
    onComplete: true,
  },
  [HISTORY_SETTINGS.thumbnails]: {
    onFailure: true,
    onComplete: true,
  },
  [HISTORY_SETTINGS.timelapse]: {
    onFailure: false,
    onComplete: false,
    deleteAfter: false,
  },
};

const getDefaultSettings = () => ({
  onlinePolling,
  server,
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  timeout: getDefaultTimeout(),
  history,
});

module.exports = {
  HISTORY_SETTINGS,
  history,
  server,
  getDefaultTimeout,
  onlinePolling,
  printerFileCleanSettingKey,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings,
};
