import { z } from "zod";
import {
  printerApiKeyValidator,
  printerEnabledValidator,
  printerNameValidator,
  printerPasswordValidator,
  printerTypeValidator,
  printerUrlValidator,
  printerUsernameValidator,
  refineApiKeyValidator,
} from "@/services/validators/printer-service.validation";

export const createTestPrinterSchema = z
  .object({
    printerURL: printerUrlValidator,
    printerType: printerTypeValidator,
    apiKey: printerApiKeyValidator,
    enabled: printerEnabledValidator.optional(),
    name: printerNameValidator.optional(),
    username: printerUsernameValidator.optional(),
    password: printerPasswordValidator.optional(),
  })
  .strict()
  .superRefine(refineApiKeyValidator);
