const { minPrinterFloorNameLength } = require("../../constants/service.constants");

const removePrinterInFloorRules = {
  printerId: "required|mongoId",
};

const printerInFloorRules = {
  printerId: "required|mongoId",
  x: "required|integer|between:0,8",
  y: "required|integer|between:0,8",
};

const updatePrinterFloorNameRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
};

const updatePrinterFloorNumberRules = {
  floor: `required|integer`,
};

const createPrinterFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: `required|integer`,
  printers: "array",
};

module.exports = {
  printerInFloorRules,
  removePrinterInFloorRules,
  updatePrinterFloorNameRules,
  updatePrinterFloorNumberRules,
  createPrinterFloorRules,
};
