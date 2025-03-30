import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { OctoprintType, PrinterTypes } from "@/services/printer-api.interface";
import { z } from "zod";
import { numberEnum } from "@/handlers/validators";

export const validateApiKey = z
  .string()
  .min(apiKeyLengthMinDefault)
  .max(apiKeyLengthMaxDefault)
  .regex(/^[a-zA-Z0-9_-]+$/, "Alpha-numeric, dash, and underscore only")
  .optional();

export const createPrinterSchema = z
  .object({
    printerURL: z.string().url(),
    printerType: z.number().superRefine(numberEnum(PrinterTypes)),
    apiKey: validateApiKey,
    enabled: z.boolean().optional(), // Optional, adjust as needed
    name: z.string(), // Name is required
  })
  .strip()
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

export const updatePrinterEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const updatePrinterDisabledReasonSchema = z.object({
  disabledReason: z.string().nullable(),
  enabled: z.boolean().optional(),
});
