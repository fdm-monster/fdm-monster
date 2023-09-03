module.exports = {
  wizardSettingsRules: {
    loginRequired: "required|boolean",
    registration: "required|boolean",
    rootUsername: "required|string",
    rootPassword: "required|string",
  },
  whitelistSettingRules: {
    whitelistedIpAddresses: "required|array|minLength:1",
    "whitelistedIpAddresses.*": "required|string",
    whitelistEnabled: "required|boolean",
  },
  sentryDiagnosticsEnabledRules: {
    enabled: "required|boolean",
  },
};
