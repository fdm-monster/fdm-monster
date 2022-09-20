const {
  minPrinterGroupNameLength,
  minPrinterFloorNameLength
} = require("../../constants/service.constants");

const printerGroupInFloorRules = {
  printerGroupId: "required|mongoId"
};

const updatePrinterFloorNameRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`
};

const createPrinterFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  printerGroups: "array"
};

module.exports = {
  printerGroupInFloorRules,
  updatePrinterFloorNameRules,
  createPrinterFloorRules
};
