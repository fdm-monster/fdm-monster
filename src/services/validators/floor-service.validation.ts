import { minFloorNameLength } from "@/constants/service.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const removePrinterInFloorRules = {
  printerId: idRuleV2,
};

export const printerInFloorRules = {
  printerId: idRuleV2,
  floorId: idRuleV2,
  x: "required|integer|between:0,12",
  y: "required|integer|between:0,12",
};

export const updateFloorNameRules = {
  name: `required|minLength:${minFloorNameLength}`,
};

export const updateFloorNumberRules = {
  floor: "required|integer",
};

export const updateFloorRules = {
  name: `required|minLength:${minFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
  "printer.*.printerId": "required|integer",
  "printer.*.x": "required|integer|between:0,12",
  "printer.*.y": "required|integer|between:0,12",
};

export const createFloorRules = {
  name: `required|minLength:${minFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
};
