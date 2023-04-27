const { minPrinterFloorNameLength } = require("../../constants/service.constants");

const removePrinterInFloorRules = {
  printerId: "required|mongoId",
};

const printerInFloorRules = {
  printerId: "required|mongoId",
  x: "required|integer|between:0,8",
  y: "required|integer|between:0,8",
};

const updateFloorNameRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
};

const updateFloorNumberRules = {
  floor: `required|integer`,
};

const createFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: `required|integer`,
  printers: "array",
};

module.exports = {
  printerInFloorRules,
  removePrinterInFloorRules,
  updateFloorNameRules,
  updateFloorNumberRules,
  createFloorRules,
};
