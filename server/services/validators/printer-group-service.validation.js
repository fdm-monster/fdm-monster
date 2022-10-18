const { minPrinterGroupNameLength } = require("../../constants/service.constants");

const printerIdRules = {
  printerId: "required|mongoId",
};

const printerInGroupRules = {
  printerId: "required|mongoId",
  location: "required|string",
};

const updatePrinterGroupNameRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
};

const updatePrinterGroupRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
  location: "required|object",
  "location.x": "required|integer|min:-1|max:4",
  "location.y": "required|integer|min:-1|max:4",
};

const createPrinterGroupRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
  location: "required|object",
  "location.x": "required|integer|min:-1|max:4",
  "location.y": "required|integer|min:-1|max:4",
  printers: "array",
  "printers.*": "required|object",
  "printers.*.printerId": "required|mongoId",
  "printers.*.location": "string",
};

module.exports = {
  createPrinterGroupRules,
  updatePrinterGroupRules,
  updatePrinterGroupNameRules,
  printerIdRules,
  printerInGroupRules,
};
