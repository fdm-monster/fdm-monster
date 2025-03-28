import { z } from "zod";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const createCameraStreamSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite),
    streamURL: z
      .string()
      .url("Invalid URL format")
      .refine((val) => /^https?:\/\//.test(val), {
        message: "Stream URL must be a valid HTTP or HTTPS URL",
      }),
    name: z.string().min(1, "Name is required").optional(),
  });
