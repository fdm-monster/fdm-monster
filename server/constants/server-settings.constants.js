const { AppConstants } = require("../server.constants");

// Default Settings
const onlinePolling = {
  seconds: 0.5
};

const server = {
  port: AppConstants.defaultServerPort,
  uploadFolder: AppConstants.defaultFileStorageFolder,
  registration: true,
  loginRequired: false
};

const getDefaultTimeout = () => ({
  apiTimeout: 1000,
  apiRetryCutoff: 10000,
  apiRetry: 30000,
  webSocketRetry: 5000
});

const printerFileCleanSettingKey = 'printerFileClean';
const getDefaultPrinterFileCleanSettings = () => ({
  autoRemoveOldFilesBeforeUpload: false,
  autoRemoveOldFilesCriteriumDays: 5
});

const HISTORY_SETTINGS = {
  snapshot: "snapshot",
  thumbnails: "thumbnails",
  timelapse: "timelapse"
};

const history = {
  [HISTORY_SETTINGS.snapshot]: {
    onFailure: true,
    onComplete: true
  },
  [HISTORY_SETTINGS.thumbnails]: {
    onFailure: true,
    onComplete: true
  },
  [HISTORY_SETTINGS.timelapse]: {
    onFailure: false,
    onComplete: false,
    deleteAfter: false
  }
};

const influxExport = {
  active: false,
  host: null,
  port: 8086,
  database: "3DPrintExport",
  username: null,
  password: null,
  retentionPolicy: {
    duration: "365d",
    replication: 1,
    defaultRet: true
  }
};

const getDefaultSettings = () => ({
  onlinePolling,
  server,
  [printerFileCleanSettingKey]: getDefaultPrinterFileCleanSettings(),
  timeout: getDefaultTimeout(),
  history,
  influxExport
});

module.exports = {
  influxExport,
  HISTORY_SETTINGS,
  history,
  server,
  getDefaultTimeout,
  onlinePolling,
  printerFileCleanSettingKey,
  getDefaultPrinterFileCleanSettings,
  getDefaultSettings
};
