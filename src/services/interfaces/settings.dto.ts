import {
  credentialSettingsKey,
  fileCleanSettingKey,
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";

export interface DebugSettingsDto {
  debugSocketIoEvents: boolean;
  debugSocketReconnect: boolean;
  debugSocketRetries: boolean;
  debugSocketSetup: boolean;
  debugSocketMessages: boolean;
  debugSocketIoBandwidth: boolean;
}

export class IpWhitelistSettingsDto {
  whitelistedIpAddresses: string[];
  whitelistEnabled: boolean;
}

export interface ServerSettingsDto {
  sentryDiagnosticsEnabled: boolean;
  registration: boolean;
  loginRequired: boolean;
  whitelistEnabled: boolean;
  whitelistedIpAddresses: string[];
  debugSettings: DebugSettingsDto;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeoutSettingsDto {
  apiTimeout: number;
}

export interface SettingsDto {
  [serverSettingsKey]: ServerSettingsDto;
  [wizardSettingKey]: WizardSettingsDto;
  [frontendSettingKey]: FrontendSettingsDto;
  [credentialSettingsKey]: CredentialSettingsDto;
  [fileCleanSettingKey]: FileCleanSettingsDto;
  [timeoutSettingKey]: TimeoutSettingsDto;
}
