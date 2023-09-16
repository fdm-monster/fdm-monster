// Wizard version 1
export const wizardSettingsRules = {
  loginRequired: "required|boolean",
  registration: "required|boolean",
  rootUsername: "required|string",
  rootPassword: "required|string",
};
export const whitelistSettingRules = {
  whitelistedIpAddresses: "required|array|minLength:1",
  "whitelistedIpAddresses.*": "required|string",
  whitelistEnabled: "required|boolean",
};
export const sentryDiagnosticsEnabledRules = {
  enabled: "required|boolean",
};
