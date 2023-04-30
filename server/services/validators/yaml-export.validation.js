const exportPrintersYamlRules = {
  printerComparisonStrategiesByPriority: "required|arrayUnique|minLength:1",
  "printerComparisonStrategiesByPriority.*": "required|string|in:name,url,id",
  exportPrinters: "required|boolean",
  // dropPrinterIds: "required|boolean", // optional idea for future
  exportFloorGrid: "required|boolean",
  exportFloors: "required|boolean",
  // dropFloorIds: "required|boolean", // optional idea for future
  floorComparisonStrategiesByPriority: "required|string|in:name,floor,id",
  notes: "string",
};

module.exports = { exportPrintersYamlRules };
