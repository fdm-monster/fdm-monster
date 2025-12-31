import { AppConstants } from "@/server.constants";
import {
  CredentialSettingsDto,
  FileCleanSettingsDto,
  FrontendSettingsDto,
  ServerSettingsDto,
  TimeoutSettingsDto,
  WizardSettingsDto,
} from "@/services/interfaces/settings.dto";
import { v4 as uuidv4 } from "uuid";

export const wizardSettingKey = "wizard";
export const getDefaultWizardSettings = (): WizardSettingsDto => ({
  wizardCompleted: false,
  wizardCompletedAt: null,
  wizardVersion: 0,
});

export const serverSettingsKey = "server";
export const getDefaultServerSettings = (): ServerSettingsDto => ({
  sentryDiagnosticsEnabled: false,
  loginRequired: true,
  registration: false,
  experimentalMoonrakerSupport: false,
  experimentalBambuSupport: false,
  experimentalThumbnailSupport: false,
  experimentalPrusaLinkSupport: false,
});

export const credentialSettingsKey = "credentials";
export const getDefaultCredentialSettings = (): CredentialSettingsDto => ({
  // Signing only, verification is automatic
  jwtExpiresIn: AppConstants.DEFAULT_JWT_EXPIRES_IN,
  // Verification only, bringing into effect requires updating all stored refresh tokens
  refreshTokenAttempts: AppConstants.DEFAULT_REFRESH_TOKEN_ATTEMPTS,
  // Verification only, bringing into effect requires updating all stored refresh tokens
  refreshTokenExpiry: AppConstants.DEFAULT_REFRESH_TOKEN_EXPIRY,
});

export const frontendSettingKey = "frontend";
export const getDefaultFrontendSettings = (): FrontendSettingsDto => ({
  gridCols: 4,
  gridRows: 2,
  largeTiles: false,
  tilePreferCancelOverQuickStop: false,
});

export const timeoutSettingKey = "timeout";
export const getDefaultTimeout = (): TimeoutSettingsDto => ({
  apiTimeout: 10000,
  apiUploadTimeout: 30000,
});

export const printerFileCleanSettingKey = "printerFileClean";
export const getDefaultFileCleanSettings = (): FileCleanSettingsDto => ({
  autoRemoveOldFilesBeforeUpload: false,
  autoRemoveOldFilesAtBoot: false,
  autoRemoveOldFilesCriteriumDays: 7,
});

export const getDefaultSettings = () => ({
  [serverSettingsKey]: getDefaultServerSettings(),
  [wizardSettingKey]: getDefaultWizardSettings(),
  [credentialSettingsKey]: {
    ...getDefaultCredentialSettings(),
    jwtSecret: uuidv4(),
  },
  [printerFileCleanSettingKey]: getDefaultFileCleanSettings(),
  [frontendSettingKey]: getDefaultFrontendSettings(),
  [timeoutSettingKey]: getDefaultTimeout(),
});
