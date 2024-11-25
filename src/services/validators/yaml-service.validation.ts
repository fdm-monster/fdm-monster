import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { OctoprintType, MoonrakerType } from "@/services/printer-api.interface";

export const exportPrintersFloorsYamlRules = {
  // Used to export
  exportPrinters: "required|boolean",
  exportFloorGrid: "required|boolean",
  exportFloors: "required|boolean",
  // TODO in V2 this should be required
  exportGroups: "boolean",
  // Used to determine import strategy
  printerComparisonStrategiesByPriority: "required|arrayUnique|minLength:1",
  "printerComparisonStrategiesByPriority.*": "required|string|in:name,url,id",
  floorComparisonStrategiesByPriority: "required|string|in:name,floor,id",
  // Helpful reference
  notes: "string",
  // Future ideas
  // dropPrinterIds: "required|boolean", // optional idea for future
  // dropFloorIds: "required|boolean", // optional idea for future
};

export const importPrintersFloorsYamlRules = (
  importPrinters: boolean,
  importFloorGrid: boolean,
  importFloors: boolean,
  importGroups: boolean
) => {
  return {
    version: "required|string",
    config: "required|object",
    "config.exportPrinters": "required|boolean",
    "config.exportFloorGrid": "required|boolean",
    "config.exportFloors": "required|boolean",
    "config.exportGroups": "boolean",
    "config.printerComparisonStrategiesByPriority": "required|arrayUnique|minLength:1",
    "config.printerComparisonStrategiesByPriority.*": "required|string|in:name,url,id",
    "config.floorComparisonStrategiesByPriority": "required|string|in:name,floor,id",
    printers: `${!!importPrinters ? "array|minLength:0" : "not"}`,
    "printers.*.id": "required",
    "printers.*.apiKey": `required|length:${apiKeyLengthMaxDefault},${apiKeyLengthMinDefault}|alphaDash`,
    "printers.*.printerURL": "required|httpurl",
    "printers.*.enabled": "boolean",
    "printers.*.printerType": `integer|in:${OctoprintType},${MoonrakerType}`,
    "printers.*.name": "required|string",
    floors: `${!!importFloors ? "array|minLength:0" : "not"}`,
    "floors.*.id": "required",
    "floors.*.floor": "required|integer",
    "floors.*.name": "required|string",
    // TODO no grid check?
    groups: `${!!importGroups ? "array|minLength:0" : "not"}`,
    "groups.*.id": "required",
    "groups.*.name": "required|string",
    // "groups.*.printers": "required|array",
    // "groups.*.printers.*.printerId": "required",
  };
};

export const importPrinterPositionsRules = (isTypeormMode: boolean) => ({
  printers: "array|minLength:0",
  "printers.*.printerId": "required",
  // isTypeormMode ? "integer|min:1" : "mongoId",
  "printers.*.x": "required|integer|min:0|max:12",
  "printers.*.y": "required|integer|min:0|max:12",
});
