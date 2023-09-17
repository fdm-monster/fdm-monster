import { UUID_LENGTH } from "@/constants/service.constants";

export const createTestPrinterRules = {
  correlationToken: "required|string",
  apiKey: `required|length:${UUID_LENGTH},${UUID_LENGTH}|alphaNumeric`,
  printerURL: "required|httpurl",
};
