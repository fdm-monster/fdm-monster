import { z } from "zod";

export const findPrinterCompletionSchema = z.object({
  correlationId: z.string().min(1),
});
