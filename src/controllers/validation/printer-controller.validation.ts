import { z } from "zod";
import {
  printerTypeValidator,
  printerUrlValidator,
  printerApiKeyValidator,
  printerEnabledValidator,
  printerDisabledReasonValidator,
  refineApiKeyValidator,
} from "@/services/validators/printer-service.validation";

export const flowRateSchema = z.object({
  flowRate: z.number().int().min(75).max(125).nonnegative(),
});

export const feedRateSchema = z.object({
  feedRate: z.number().int().min(10).max(200).nonnegative(),
});

export const testPrinterApiSchema = z
  .object({
    printerURL: printerUrlValidator,
    printerType: printerTypeValidator,
    apiKey: printerApiKeyValidator,
  })
  .superRefine(refineApiKeyValidator);

export const updatePrinterDisabledReasonSchema = z.object({
  disabledReason: printerDisabledReasonValidator,
});

export const updatePrinterEnabledSchema = z.object({
  enabled: printerEnabledValidator,
});

export const updatePrinterConnectionSettingSchema = z.object({
  printerType: printerTypeValidator,
  printerURL: printerUrlValidator,
  apiKey: printerApiKeyValidator,
});
