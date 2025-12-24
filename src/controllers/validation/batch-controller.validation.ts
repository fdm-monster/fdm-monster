import { z } from "zod";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const batchPrinterSchema =
  z.object({
    printerIds: z.array(idRuleV2),
  });

export const executeBatchRePrinterSchema =
  z.object({
    prints: z.array(
      z.object({
        printerId: idRuleV2,
        path: z.string(),
      }),
    ),
  });

export const batchPrintersEnabledSchema =
  z.object({
    printerIds: z.array(idRuleV2),
    enabled: z.boolean(),
  });
