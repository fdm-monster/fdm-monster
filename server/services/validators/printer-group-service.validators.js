const { minPrinterGroupNameLength } = require("../../constants/service.constants");

const createPrinterGroupRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
  printers: `array`,
  "printers.*": `required|mongoId`
};

module.exports = {
  createPrinterGroupRules
};
