const { UUID_LENGTH } = require("../../constants/service.constants");

const createPrinterRules = {
  _id: "not",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  webSocketURL: "required|wsurl",
  enabled: "boolean",
  settingsAppearance: "object",
  "settingsAppearance.name": "string",
  camURL: "httpurl"
};

const updatePrinterEnabledRule = {
  enabled: "required|boolean"
};

module.exports = {
  createPrinterRules,
  updatePrinterEnabledRule
};
