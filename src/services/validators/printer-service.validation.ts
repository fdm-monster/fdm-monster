import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { MoonrakerType, OctoprintType, PrinterTypes } from "@/services/printer-api.interface";
import { RefinementCtx, z } from "zod";
import { numberEnum } from "@/handlers/validators";

const octoPrintApiKeySchema = z
  .string()
  .min(apiKeyLengthMinDefault)
  .max(apiKeyLengthMaxDefault)
  .regex(/^[a-zA-Z0-9_-]+$/, "Alpha-numeric, dash, and underscore only");

export const printerApiKeyValidator = z.string().optional();
export const printerNameValidator = z.string();
export const printerEnabledValidator = z.boolean();
export const printerDisabledReasonValidator = z.string().optional();
export const printerUrlValidator = z.string().url();
export const printerTypeValidator = z.union(
  [z.literal(OctoprintType), z.literal(MoonrakerType)],
).superRefine(numberEnum(PrinterTypes));
export const printerDateAddedValidator = z.number().optional();

const basePrinterSchema = z
  .object({
    dateAdded: printerDateAddedValidator,
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
  // OctoPrint apiKey constraints
  if (data.printerType === OctoprintType) {
    const result = octoPrintApiKeySchema.safeParse(data.apiKey);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          // Nesting misses path under "apiKey"
          path: ["apiKey", ...issue.path],
        });
      });
    }
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
