import { z } from "zod";

export const createApiKeySchema = z.object({
  label: z.string().trim().min(1, "label is required").max(80, "label too long (max 80 chars)"),
});

export const apiKeyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
