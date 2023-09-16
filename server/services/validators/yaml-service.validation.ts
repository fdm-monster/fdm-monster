const { UUID_LENGTH } = require("../../constants/service.constants");
const exportPrintersFloorsYamlRules = {
  // Used to export
  exportPrinters: "required|boolean",
  exportFloorGrid: "required|boolean",
  exportFloors: "required|boolean",
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

const importPrintersFloorsYamlRules = (importPrinters, importFloorGrid, importFloors) => ({
  version: "required|string",
  config: "required|object",
  "config.exportPrinters": "required|boolean",
  "config.exportFloorGrid": "required|boolean",
  "config.exportFloors": "required|boolean",
  "config.printerComparisonStrategiesByPriority": "required|arrayUnique|minLength:1",
  "config.printerComparisonStrategiesByPriority.*": "required|string|in:name,url,id",
  "config.floorComparisonStrategiesByPriority": "required|string|in:name,floor,id",
  printers: `${!!importPrinters ? "array|minLength:0" : "not"}`,
  "printers.*.id": "mongoId",
  "printers.*.apiKey": `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  "printers.*.printerURL": "required|httpurl",
  "printers.*.enabled": "boolean",
  "printers.*.settingsAppearance": "required|object",
  "printers.*.settingsAppearance.name": "required|string",
  floors: `${!!importFloors ? "array|minLength:0" : "not"}`,
  "floors.*.id": "required|mongoId",
  "floors.*.floor": "required|integer",
  "floors.*.name": "required|string",
});

const importPrinterPositionsRules = {
  printers: "array|minLength:0",
  "printers.*.printerId": "required|mongoId",
  "printers.*.x": "required|integer|min:0|max:12",
  "printers.*.y": "required|integer|min:0|max:12",
};

module.exports = { exportPrintersFloorsYamlRules, importPrintersFloorsYamlRules, importPrinterPositionsRules };
