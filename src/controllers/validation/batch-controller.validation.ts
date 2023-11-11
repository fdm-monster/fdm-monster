import { idRuleV2, idRulesV2 } from "@/controllers/validation/generic.validation";

export const batchPrinterRules = (isSqlite: boolean) => ({
  printerIds: "required|array",
  "printerIds.*": idRuleV2(isSqlite),
});

export const batchPrintersEnabledRules = (isSqlite: boolean) => ({
  printerIds: "required|array",
  "printerIds.*": idRuleV2(isSqlite),
  enabled: "required|boolean",
});
