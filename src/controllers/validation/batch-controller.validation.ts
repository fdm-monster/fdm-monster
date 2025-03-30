import { z } from "zod";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const batchPrinterSchema = (isSqlite: boolean) =>
  z.object({
    printerIds: z.array(idRuleV2(isSqlite)),
  });

export const executeBatchRePrinterSchema = (isSqlite: boolean) =>
  z.object({
    prints: z.array(
      z.object({
        printerId: idRuleV2(isSqlite),
        path: z.string(),
      })
    ),
  });

export const batchPrintersEnabledSchema = (isSqlite: boolean) =>
  z.object({
    printerIds: z.array(idRuleV2(isSqlite)),
    enabled: z.boolean(),
  });
