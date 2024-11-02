import { UUID_LENGTH } from "@/constants/service.constants";
import { OctoprintType, MoonrakerType } from "@/services/printer-api.interface";

export const createMongoPrinterRules = {
  _id: "not",
  apiKey: `requiredNotIf:printerType,1|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  enabled: "boolean",
  name: "string",
};

export const createPrinterRules = {
  apiKey: `requiredNotIf:printerType,1|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
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
