const { UUID_LENGTH } = require("../../constants/service.constants");

const createTestPrinterRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  correlationToken: "required|string",
  printerURL: "required|httpurl",
  webSocketURL: "required|wsurl",
  camURL: "httpurl"
};

module.exports = {
  createTestPrinterRules
};
