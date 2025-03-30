import { minFloorNameLength } from "@/constants/service.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const removePrinterInFloorRules = (isSqlite: boolean) => ({
  printerId: idRuleV2(isSqlite),
});

export const printerInFloorRules = (isSqlite: boolean) => ({
  printerId: idRuleV2(isSqlite),
  floorId: idRuleV2(isSqlite),
  x: "required|integer|between:0,12",
  y: "required|integer|between:0,12",
});

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
  "printer.*.printerId": "required|mongoId",
  "printer.*.x": "required|integer|between:0,12",
  "printer.*.y": "required|integer|between:0,12",
};

export const createFloorRules = {
  name: `required|minLength:${minFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
};
