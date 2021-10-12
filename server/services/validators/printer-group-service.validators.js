const { minPrinterGroupNameLength } = require("../../constants/service.constants");

const createPrinterGroupRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
  printers: "array",
  "printers.*": "required|object",
  "printers.*.printerId": "required|mongoId",
  "printers.*.location": "string"
};

module.exports = {
  createPrinterGroupRules
};
