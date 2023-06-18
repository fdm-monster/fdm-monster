const { UUID_LENGTH } = require("../../constants/service.constants");

const createPrinterRules = {
  _id: "not",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  enabled: "boolean",
  settingsAppearance: "object",
  "settingsAppearance.name": "string",
};

const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

const updateApiUsernameRule = {
  currentUser: "required|string",
};

const updatePrinterDisabledReasonRule = {
  disabledReason: "required|nullable|string",
  enabled: "boolean",
};

module.exports = {
  createPrinterRules,
  updatePrinterEnabledRule,
  updateApiUsernameRule,
  updatePrinterDisabledReasonRule,
};
