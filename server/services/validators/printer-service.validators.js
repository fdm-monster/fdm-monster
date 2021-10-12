const { UUID_LENGTH } = require("../../constants/service.constants");

const createPrinterRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  webSocketURL: "required|wsurl",
  enabled: "boolean",
  groups: "required|array",
  settingsAppearance: "object",
  "settingsAppearance.name": "string",
  camURL: "httpurl"
};

const updatePrinterEnabledRule = {
  enabled: `required|boolean`
};

module.exports = {
  createPrinterRules,
  updatePrinterEnabledRule
};
