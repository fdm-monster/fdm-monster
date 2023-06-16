module.exports = {
  whitelistSettingRules: {
    whitelistedIpAddresses: "required|array|minLength:1",
    "whitelistedIpAddresses.*": "required|string",
    whitelistEnabled: "required|boolean",
  },
  anonymousDiagnosticsEnabledRules: {
    enabled: "required|boolean",
  },
};
