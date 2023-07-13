const { Schema, model } = require("mongoose");
const {
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  frontendSettingKey,
} = require("../constants/server-settings.constants");

const ServerSettingsSchema = new Schema({
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
    sentryDiagnosticsEnabled: {
      type: Boolean,
      default: false,
      required: true,
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
    loginRequired: {
      type: Boolean,
      default: false,
      required: true,
    },
    // TODO: Feature not fully tested/implemented yet
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
  },
});

const ServerSettings = model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
