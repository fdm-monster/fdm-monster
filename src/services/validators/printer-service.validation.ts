import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { OctoprintType, PrinterTypes } from "@/services/printer-api.interface";
import { RefinementCtx, z } from "zod";
import { numberEnum } from "@/handlers/validators";

export const printerApiKeyValidator = z
  .string()
  .min(apiKeyLengthMinDefault)
  .max(apiKeyLengthMaxDefault)
  .regex(/^[a-zA-Z0-9_-]+$/, "Alpha-numeric, dash, and underscore only")
  // Requires superRefine to validate whether required or not
  .optional();

export const printerNameValidator = z.string();
export const printerEnabledValidator = z.boolean();
export const printerDisabledReasonValidator = z.string().optional();
export const printerUrlValidator = z.string().url();
export const printerTypeValidator = z.number().superRefine(numberEnum(PrinterTypes));

const basePrinterSchema = z
  .object({
    printerURL: printerUrlValidator,
    printerType: printerTypeValidator,
    apiKey: printerApiKeyValidator,
    enabled: printerEnabledValidator.optional(),
    name: printerNameValidator,
  })
  .strip();

// Infer base schema required to do superRefine
const apiKeyPrinterTypeSchema = z.object({
  apiKey: printerApiKeyValidator,
  printerType: printerTypeValidator,
});
type ApiKeyPrinterTypeSchema = z.infer<typeof apiKeyPrinterTypeSchema>;

export const refineApiKeyValidator = <T extends ApiKeyPrinterTypeSchema>(data: T, ctx: RefinementCtx) => {
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
};

export const createPrinterSchema = basePrinterSchema.superRefine(refineApiKeyValidator);

export const updatePrinterEnabledSchema = z.object({
  enabled: printerEnabledValidator,
});

export const updatePrinterDisabledReasonSchema = z.object({
  disabledReason: printerDisabledReasonValidator,
  enabled: printerEnabledValidator.optional(),
});
