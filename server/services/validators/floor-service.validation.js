const { minPrinterFloorNameLength } = require("../../constants/service.constants");

const removePrinterInFloorRules = {
  printerId: "required|mongoId",
};

const printerInFloorRules = {
  printerId: "required|mongoId",
  x: "required|integer|between:0,12",
  y: "required|integer|between:0,12",
};

const updateFloorNameRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
};

const updateFloorNumberRules = {
  floor: "required|integer",
};

const updateFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
  "printer.*.printerId": "required|mongoId",
  "printer.*.x": "required|integer|between:0,12",
  "printer.*.y": "required|integer|between:0,12",
};

const createFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
};

module.exports = {
  printerInFloorRules,
  removePrinterInFloorRules,
  updateFloorRules,
  updateFloorNameRules,
  updateFloorNumberRules,
  createFloorRules,
};
