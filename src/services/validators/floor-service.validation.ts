import { minPrinterFloorNameLength } from "@/constants/service.constants";

export const removePrinterInFloorRules = {
  printerId: "required|mongoId",
};

export const printerInFloorRules = {
  printerId: "required|mongoId",
  floorId: "required|mongoId",
  x: "required|integer|between:0,12",
  y: "required|integer|between:0,12",
};

export const updateFloorNameRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
};

export const updateFloorNumberRules = {
  floor: "required|integer",
};

export const updateFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
  "printer.*.floorId": "required|mongoId",
  "printer.*.printerId": "required|mongoId",
  "printer.*.x": "required|integer|between:0,12",
  "printer.*.y": "required|integer|between:0,12",
};

export const createFloorRules = {
  name: `required|minLength:${minPrinterFloorNameLength}`,
  floor: "required|integer",
  printers: "array",
};
