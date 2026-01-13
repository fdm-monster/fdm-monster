import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { OctoprintType, PrinterTypesEnum, PrusaLinkType, BambuType } from "@/services/printer-api.interface";
import { RefinementCtx, z } from "zod";

const octoPrintApiKeySchema = z
  .string()
  .min(apiKeyLengthMinDefault)
  .max(apiKeyLengthMaxDefault)
  .regex(/^[a-zA-Z0-9_-]+$/, "Alpha-numeric, dash, and underscore only");

export const printerApiKeyValidator = z.string().optional();
export const printerNameValidator = z.string();
export const printerUsernameValidator = z.string().nullable();
export const printerPasswordValidator = z.string().nullable();
export const printerEnabledValidator = z.boolean();
export const printerDisabledReasonValidator = z.string().nullable();
export const printerUrlValidator = z.string().url();
export const printerTypeValidator = z.nativeEnum(PrinterTypesEnum);
export const printerDateAddedValidator = z.number().optional();

const prusaLinkAuthSchema = z.object({
  username: printerUsernameValidator,
  password: printerPasswordValidator,
});

const basePrinterSchema = z
  .object({
    dateAdded: printerDateAddedValidator,
    printerURL: printerUrlValidator,
    printerType: printerTypeValidator,
    apiKey: printerApiKeyValidator,
    username: printerUsernameValidator.optional(),
    password: printerPasswordValidator.optional(),
    enabled: printerEnabledValidator.optional(),
    name: printerNameValidator,
  })
  .strip();

// Infer base schema required to do superRefine
const apiKeyPrinterTypeSchema = z.object({
  apiKey: printerApiKeyValidator,
  printerType: printerTypeValidator,
  username: printerUsernameValidator.optional(),
  password: printerPasswordValidator.optional(),
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
  } else if (data.printerType === PrusaLinkType || data.printerType === BambuType) {
    const result = prusaLinkAuthSchema.safeParse({
      username: data.username,
      password: data.password,
    });
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          // Nesting misses path under "username"
          path: ["username", ...issue.path],
        });
        ctx.addIssue({
          ...issue,
          // Nesting misses path under "password"
          path: ["password", ...issue.path],
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
});
