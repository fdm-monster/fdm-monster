import { z } from "zod";

export const updateClientBundleSchema = z.object({
  downloadRelease: z.string().optional(),
  allowDowngrade: z.boolean().default(false),
});
