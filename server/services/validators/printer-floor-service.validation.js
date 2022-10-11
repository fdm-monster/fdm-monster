const {
  minPrinterGroupNameLength,
  minPrinterFloorNameLength,
} = require("../../constants/service.constants");

const printerGroupInFloorRules = {
  printerGroupId: "required|mongoId",
};

const updatePrinterFloorNameRules = {
  name: `required|minLength:${minPrinterGroupNameLength}`,
};

const updatePrinterFloorNumberRules = {
  floor: `required|integer`,
};

const createPrinterFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: `required|integer`,
  printerGroups: "array",
};

module.exports = {
  printerGroupInFloorRules,
  updatePrinterFloorNameRules,
  updatePrinterFloorNumberRules,
  createPrinterFloorRules,
};
