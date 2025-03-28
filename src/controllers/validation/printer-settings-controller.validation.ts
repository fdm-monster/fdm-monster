import { z } from "zod";

export const setGcodeAnalysisSchema = z.object({
  enabled: z.boolean(),
});
