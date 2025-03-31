import { z } from "zod";
import {
  printerApiKeyValidator,
  printerEnabledValidator,
  printerNameValidator,
  printerTypeValidator,
  printerUrlValidator,
  refineApiKeyValidator,
} from "@/services/validators/printer-service.validation";

export const createTestPrinterSchema = z
  .object({
    printerURL: printerUrlValidator,
    printerType: printerTypeValidator,
    apiKey: printerApiKeyValidator,
    enabled: printerEnabledValidator.optional(),
    name: printerNameValidator,
    correlationToken: z.string(),
  })
  .strict()
  .superRefine(refineApiKeyValidator);
