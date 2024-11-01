import { isProductionEnvironment } from "@/utils/env.utils";

export const serverSettingsUpdateRules = (whitelistFeatureEnabled: boolean) => ({
  registration: "boolean",
  loginRequired: "boolean",
  debugSettings: "object",
  "debugSettings.debugSocketEvents": "boolean",
  "debugSettings.debugSocketReconnect": "boolean",
  whitelistEnabled: whitelistFeatureEnabled ? "boolean" : "not",
  whitelistedIpAddresses: whitelistFeatureEnabled ? "array|minLength:1" : "not",
  "whitelistedIpAddresses.*": whitelistFeatureEnabled ? "required|string" : "not",
  experimentalMoonrakerSupport: "boolean",
});

export const timeoutSettingsUpdateRules = {
  apiTimeout: "integer|min:1000",
};

export const frontendSettingsUpdateRules = {
  gridCols: "integer|min:1",
  gridRows: "integer|min:1",
  largeTiles: "boolean",
};

export const credentialSettingPatchRules = {
  jwtSecret: "string",
  jwtExpiresIn: isProductionEnvironment() ? "integer|min:120|max:7200" : "integer|min:0",
  refreshTokenAttempts: "integer|min:-1",
  refreshTokenExpiry: isProductionEnvironment() ? "integer|min:240" : "integer|min:0",
};

export const whitelistSettingUpdateRules = {
  whitelistedIpAddresses: "required|array|minLength:1",
  "whitelistedIpAddresses.*": "required|string",
  whitelistEnabled: "required|boolean",
};

export const wizardUpdateRules = {
  wizardCompleted: "required|boolean",
  wizardCompletedAt: "required|date|nullable",
  wizardVersion: "required|integer|min:0",
};

export const fileCleanSettingsUpdateRules = {
  autoRemoveOldFilesBeforeUpload: "required|boolean",
  autoRemoveOldFilesAtBoot: "required|boolean",
  autoRemoveOldFilesCriteriumDays: "required|integer|min:0",
};

export const sentryDiagnosticsEnabledRules = {
  enabled: "required|boolean",
};

export const moonrakerSupportRules = {
  enabled: "required|boolean",
};

export const clientNextRules = {
  enabled: "required|boolean",
};
