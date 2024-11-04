import { UUID_LENGTH } from "@/constants/service.constants";
import { OctoprintType, MoonrakerType } from "@/services/printer-api.interface";

export const createMongoPrinterRules = {
  _id: "not",
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  enabled: "boolean",
  name: "string",
};

export const createPrinterRules = {
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
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
