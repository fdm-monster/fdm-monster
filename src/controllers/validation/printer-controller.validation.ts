import { UUID_LENGTH } from "@/constants/service.constants";

export const flowRateRules = {
  flowRate: "required|between:75,125|integer",
};

export const feedRateRules = {
  feedRate: "required|between:10,200|integer",
};

export const testPrinterApiRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
};

export const updatePrinterDisabledReasonRules = {
  disabledReason: "string",
};

export const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

export const updatePrinterConnectionSettingRules = {
  printerURL: "required|httpurl",
  apiKey: `required|minLength:${UUID_LENGTH}|maxLength:${UUID_LENGTH}`,
};

export const createOctoPrintBackupRules = {
  exclude: "array",
  "exclude.*": "string",
};

export const getOctoPrintBackupRules = {
  fileName: "required|string",
};
