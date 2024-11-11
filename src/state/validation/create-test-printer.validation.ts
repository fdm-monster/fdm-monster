import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";

export const createTestPrinterRules = {
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  correlationToken: "required|string",
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${apiKeyLengthMaxDefault},${apiKeyLengthMinDefault}|alphaDash`,
  printerURL: "required|httpurl",
};
