import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const batchPrinterRules = {
  printerIds: "required|array",
  "printerIds.*": idRuleV2,
};

export const executeBatchRePrinterRule = {
  prints: "required|array",
  "prints.*": "required",
  "prints.*.printerId": idRuleV2,
  "prints.*.path": "required|string",
};

export const batchPrintersEnabledRules = {
  printerIds: "required|array",
  "printerIds.*": idRuleV2,
  enabled: "required|boolean",
};
