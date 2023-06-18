const { UUID_LENGTH } = require("../../constants/service.constants");

const createTestPrinterRules = {
  correlationToken: "required|string",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
};

module.exports = {
  createTestPrinterRules,
};
