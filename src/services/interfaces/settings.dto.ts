import {
  printerFileCleanSettingKey,
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";

export interface ServerSettingsDto {
  sentryDiagnosticsEnabled: boolean;
  registration: boolean;
  loginRequired: boolean;
  experimentalMoonrakerSupport: boolean;
  experimentalTypeormSupport: boolean;
  experimentalClientSupport: boolean;
  experimentalThumbnailSupport: boolean;
}

export interface WizardSettingsDto {
  wizardCompleted: boolean;
  wizardCompletedAt: Date | null;
  wizardVersion: number;
}

export interface FrontendSettingsDto {
  gridCols: number;
  gridRows: number;
  largeTiles: boolean;
  tilePreferCancelOverQuickStop: boolean;
}

export interface FileCleanSettingsDto {
  autoRemoveOldFilesBeforeUpload: boolean;
  autoRemoveOldFilesAtBoot: boolean;
  autoRemoveOldFilesCriteriumDays: number;
}

export interface CredentialSettingsDto {
  jwtSecret: string;
  jwtExpiresIn: number;
  refreshTokenAttempts: number;
  refreshTokenExpiry: number;
}

export interface TimeoutSettingsDto {
  apiTimeout: number;
}

export class SettingsDto<KeyType> {
  [serverSettingsKey]: ServerSettingsDto;
  [wizardSettingKey]: WizardSettingsDto;
  [frontendSettingKey]: FrontendSettingsDto;
  // [credentialSettingsKey]: CredentialSettingsDto;
  [printerFileCleanSettingKey]: FileCleanSettingsDto;
  [timeoutSettingKey]: TimeoutSettingsDto;
}
