const { minPrinterGroupNameLength } = require("../../constants/service.constants");

const printerIdRules = {
  printerId: "required|mongoId"
};

const printerInGroupRules = {
  printerId: "required|mongoId",
  location: "string"
};

const createPrinterGroupRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
  printers: "array",
  "printers.*": "required|object",
  "printers.*.printerId": "required|mongoId",
  "printers.*.location": "string"
};

module.exports = {
  createPrinterGroupRules,
  printerIdRules,
  printerInGroupRules
};
