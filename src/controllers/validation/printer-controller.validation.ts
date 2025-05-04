import { z } from "zod";
import {
  printerApiKeyValidator,
  printerDisabledReasonValidator,
  printerEnabledValidator,
  printerPasswordValidator,
  printerTypeValidator,
  printerUrlValidator,
  printerUsernameValidator,
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
    username: printerUsernameValidator.optional(),
    password: printerPasswordValidator.optional(),
  })
  .superRefine(refineApiKeyValidator);

export const updatePrinterDisabledReasonSchema = z.object({
  disabledReason: printerDisabledReasonValidator,
});

export const updatePrinterEnabledSchema = z.object({
  enabled: printerEnabledValidator,
});
