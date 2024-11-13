import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const batchPrinterRules = (isSqlite: boolean) => ({
  printerIds: "required|array",
  "printerIds.*": idRuleV2(isSqlite),
});

export const executeBatchRePrinterRule = (isSqlite: boolean) => ({
  prints: "required|array",
  "prints.*": "required",
  "prints.*.printerId": idRuleV2(isSqlite),
  "prints.*.path": "required|string",
});

export const batchPrintersEnabledRules = (isSqlite: boolean) => ({
  printerIds: "required|array",
  "printerIds.*": idRuleV2(isSqlite),
  enabled: "required|boolean",
});
