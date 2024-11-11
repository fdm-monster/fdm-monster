import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";

export const flowRateRules = {
  flowRate: "required|between:75,125|integer",
};

export const feedRateRules = {
  feedRate: "required|between:10,200|integer",
};

export const testPrinterApiRules = {
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${apiKeyLengthMaxDefault},${apiKeyLengthMinDefault}|alphaDash`,
  printerURL: "required|httpurl",
};

export const updatePrinterDisabledReasonRules = {
  disabledReason: "string",
};

export const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

export const updatePrinterConnectionSettingRules = {
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  printerURL: "required|httpurl",
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${apiKeyLengthMaxDefault},${apiKeyLengthMinDefault}|alphaDash`,
};

export const createOctoPrintBackupRules = {
  exclude: "array",
  "exclude.*": "string",
};

export const getOctoPrintBackupRules = {
  fileName: "required|string",
};
