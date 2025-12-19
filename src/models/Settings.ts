import { model, Schema } from "mongoose";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultTimeout,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { MongoIdType } from "@/shared.constants";

export interface IWizardSettings {
  wizardCompleted: boolean;
  wizardCompletedAt: Date | null;
  wizardVersion: number;
}

export interface IFileCleanSettings {
  autoRemoveOldFilesBeforeUpload: boolean;
  autoRemoveOldFilesAtBoot: boolean;
  autoRemoveOldFilesCriteriumDays: number;
}

export interface ICredentialSettings {
  jwtSecret: string;
  jwtExpiresIn: number;
  refreshTokenAttempts: number;
  refreshTokenExpiry: number;
}

export interface IServerSettings {
  sentryDiagnosticsEnabled: boolean;
  loginRequired: boolean;
  registration: boolean;
  experimentalMoonrakerSupport: boolean;
  experimentalPrusaLinkSupport: boolean;
  experimentalBambuSupport: boolean;
  experimentalClientSupport: boolean;
  experimentalThumbnailSupport: boolean;
}

export interface IFrontendSettings {
  gridCols: number;
  gridRows: number;
  largeTiles: boolean;
  tilePreferCancelOverQuickStop: boolean;
}

export interface ITimeoutSettings {
  apiTimeout: number;
  apiUploadTimeout: number;
}

export interface ISettings<KeyType = MongoIdType> {
  id: KeyType;
  [wizardSettingKey]: IWizardSettings;
  [printerFileCleanSettingKey]: IFileCleanSettings;
  [credentialSettingsKey]: ICredentialSettings;
  [serverSettingsKey]: IServerSettings;
  [frontendSettingKey]: IFrontendSettings;
  [timeoutSettingKey]: ITimeoutSettings;
}

const SettingsSchema = new Schema<ISettings>({
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
    },
    required: true,
  },
  [serverSettingsKey]: {
    sentryDiagnosticsEnabled: {
      type: Boolean,
      default: false,
      required: true,
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
    experimentalMoonrakerSupport: {
      type: Boolean,
      default: false,
      required: true,
    },
    experimentalBambuSupport: {
      type: Boolean,
      default: false,
      required: true,
    },
    experimentalClientSupport: {
      type: Boolean,
      default: false,
      required: true,
    },
    experimentalThumbnailSupport: {
      type: Boolean,
      default: false,
      required: true,
    },
    experimentalPrusaLinkSupport: {
      type: Boolean,
      default: false,
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
    tilePreferCancelOverQuickStop: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  [timeoutSettingKey]: {
    apiTimeout: {
      type: Number,
      default: getDefaultTimeout().apiTimeout,
      required: true,
    },
    apiUploadTimeout: {
      type: Number,
      default: getDefaultTimeout().apiUploadTimeout,
      required: true,
    },
  },
});

export const Settings = model("ServerSettings", SettingsSchema);
