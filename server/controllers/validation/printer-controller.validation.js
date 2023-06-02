const { UUID_LENGTH } = require("../../constants/service.constants");

const flowRateRules = {
  flowRate: "required|between:75,125|integer",
};

const feedRateRules = {
  feedRate: "required|between:10,200|integer",
};

const testPrinterApiRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
};

const updatePrinterDisabledReasonRules = {
  disabledReason: "string",
};

const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

const updatePrinterConnectionSettingRules = {
  printerURL: "required|httpurl",
  apiKey: `required|minLength:${UUID_LENGTH}|maxLength:${UUID_LENGTH}`,
};

module.exports = {
  feedRateRules,
  flowRateRules,
  testPrinterApiRules,
  updatePrinterEnabledRule,
  updatePrinterConnectionSettingRules,
  updatePrinterDisabledReasonRules,
};
