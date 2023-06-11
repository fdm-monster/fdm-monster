const mongoose = require("mongoose");
const { AppConstants } = require("../server.constants");
const {
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  frontendSettingKey,
} = require("../constants/server-settings.constants");

const ServerSettingsSchema = new mongoose.Schema({
  [printerFileCleanSettingKey]: {
    autoRemoveOldFilesBeforeUpload: {
      type: Boolean,
      default: false,
      required: true,
    },
    autoRemoveOldFilesAtBoot: {
      type: Boolean,
      default: false,
      required: true,
    },
    autoRemoveOldFilesCriteriumDays: {
      type: Number,
      default: 14,
      required: true,
    },
  },
  [serverSettingsKey]: {
    uploadFolder: {
      type: String,
      default: AppConstants.defaultFileStorageFolder,
    },
    debugSettings: {
      debugSocketIoEvents: {
        type: Boolean,
        default: false,
        required: true,
      },
      debugSocketReconnect: {
        type: Boolean,
        default: false,
        required: true,
      },
      debugSocketRetries: {
        type: Boolean,
        default: false,
        required: true,
      },
      debugSocketSetup: {
        type: Boolean,
        default: true,
        required: true,
      },
      debugSocketMessages: {
        type: Boolean,
        default: false,
        required: true,
      },
      debugSocketIoBandwidth: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    port: {
      type: Number,
      default: AppConstants.defaultServerPort,
      required: true,
    },
    loginRequired: {
      type: Boolean,
      default: false,
      required: true,
    },
    whitelistEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    whitelistedIpAddresses: [
      {
        type: String,
      },
    ],
    registration: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  [frontendSettingKey]: {
    gridCols: {
      type: Number,
      default: 8,
      required: false,
    },
    gridRows: {
      type: Number,
      default: 8,
      required: false,
    },
    largeTiles: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  [timeoutSettingKey]: {
    apiTimeout: {
      type: Number,
      default: 1000,
      required: true,
    },
    apiRetryCutoff: {
      type: Number,
      default: 10000,
      required: true,
    },
    apiRetry: {
      type: Number,
      default: 30000,
      required: true,
    },
    webSocketRetry: {
      type: Number,
      default: 5000,
      required: true,
    },
  },
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
