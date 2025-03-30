import { OctoprintType, PrinterTypes } from "@/services/printer-api.interface";
import { z } from "zod";
import { numberEnum } from "@/handlers/validators";
import { validateApiKey } from "@/services/validators/printer-service.validation";

export const createPrinterSchema = z
  .object({
    printerURL: z.string().url(),
    correlationToken: z.string(),
    printerType: z.number().superRefine(numberEnum(PrinterTypes)),
    apiKey: validateApiKey,
    enabled: z.boolean().optional(), // Optional, adjust as needed
    name: z.string(), // Name is required
  })
  .strict()
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
