import { UUID_LENGTH } from "@/constants/service.constants";
import { MoonrakerType, OctoprintType } from "@/services/printer-api.interface";

export const createTestPrinterRules = {
  printerType: `required|integer|in:${OctoprintType},${MoonrakerType}`,
  correlationToken: "required|string",
  apiKey: `requiredIf:printerType,${OctoprintType}|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
};
