import { UUID_LENGTH } from "@/constants/service.constants";
import { OctoprintType } from "@/services/printer-api.interface";

export const createMongoPrinterRules = {
  _id: "not",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType}`,
  enabled: "boolean",
  name: "string",
};

export const createPrinterRules = {
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType}`,
  enabled: "boolean",
  name: "required|string",
};

export const updatePrinterEnabledRule = {
  enabled: "required|boolean",
};

export const updatePrinterDisabledReasonRule = {
  disabledReason: "required|nullable|string",
  enabled: "boolean",
};
