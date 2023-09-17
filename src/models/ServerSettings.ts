import { model, Schema } from "mongoose";
import {
  credentialSettingsKey,
  fileCleanSettingKey,
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "../constants/server-settings.constants";

const ServerSettingsSchema = new Schema({
  [wizardSettingKey]: {
    wizardCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    wizardCompletedAt: {
      type: Date,
      default: null,
      required: false,
    },
    wizardVersion: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  [fileCleanSettingKey]: {
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
  [credentialSettingsKey]: {
    type: {
      jwtSecret: {
        type: String,
        minlength: 10,
        trim: true,
        required: true,
      },
      jwtExpiresIn: {
        type: Number,
        required: true,
      },
      refreshTokenAttempts: {
        type: Number,
        required: true,
      },
      refreshTokenExpiry: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },
    },
    required: true,
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
      default: true,
      required: true,
    },
    registration: {
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

export const ServerSettings = model("ServerSettings", ServerSettingsSchema);
