const batchPrinterRules = {
  printerIds: "required|array",
  "printerIds.*": "required|mongoId",
};

const batchPrintersEnabledRules = {
  printerIds: "required|array",
  "printerIds.*": "required|mongoId",
  enabled: "required|boolean",
};

module.exports = {
  batchPrinterRules,
  batchPrintersEnabledRules,
};
