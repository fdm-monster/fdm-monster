export const batchPrinterRules = {
  printerIds: "required|array",
  "printerIds.*": "required|mongoId",
};

export const batchPrintersEnabledRules = {
  printerIds: "required|array",
  "printerIds.*": "required|mongoId",
  enabled: "required|boolean",
};
