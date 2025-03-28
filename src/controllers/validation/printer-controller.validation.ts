import { z } from "zod";
import { OctoprintType, PrinterTypes } from "@/services/printer-api.interface";
import { numberEnum } from "@/handlers/validators";
import { validateApiKey } from "@/services/validators/printer-service.validation";

export const flowRateSchema = z.object({
  flowRate: z.number().int().min(75).max(125).nonnegative(),
});

export const feedRateSchema = z.object({
  feedRate: z.number().int().min(10).max(200).nonnegative(),
});

export const testPrinterApiSchema = z
  .object({
    printerURL: z.string().url(),
    printerType: z.number().superRefine(numberEnum(PrinterTypes)),
    apiKey: validateApiKey,
  })
  .superRefine((data, ctx) => {
    if (data.printerType === OctoprintType && !data.apiKey?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "apiKey is required when printerType is OctoprintType",
        path: ["apiKey"],
      });
      return ctx;
    }

    // Validate that apiKey length is either 32 or 43 characters if it exists
    if (data.apiKey && data.apiKey.length !== 32 && data.apiKey.length !== 43) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "apiKey must be either 32 or 43 characters long",
        path: ["apiKey"],
      });
    }
  });

export const updatePrinterDisabledReasonSchema = z.object({
  disabledReason: z.string().optional(),
});

export const updatePrinterEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const updatePrinterConnectionSettingSchema = z.object({
  printerType: z.number().superRefine(numberEnum(PrinterTypes)),
  printerURL: z.string().url(),
  apiKey: validateApiKey,
});
