import { z } from "zod";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const createCameraStreamSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite).nullish(),
    streamURL: z.string().url(),
    name: z.string().min(1).optional(),
  });
