import { z } from "zod";
import { minFloorNameLength } from "@/constants/service.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const removePrinterInFloorSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite),
  });

export const printerInFloorSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite),
    floorId: idRuleV2(isSqlite),
    x: z.number().int().min(0).max(12),
    y: z.number().int().min(0).max(12),
  });

export const updateFloorNameSchema = z.object({
  name: z.string().min(minFloorNameLength),
});

export const updateFloorLevelSchema = z.object({
  floor: z.number().int(),
});

export const updateFloorSchema = (isSqlite: boolean) =>
  z.object({
    name: z.string().min(minFloorNameLength),
    floor: z.number().int(),
    printers: z
      .array(
        z.object({
          printerId: idRuleV2(isSqlite),
          floorId: idRuleV2(isSqlite),
          x: z.number().min(0).max(12),
          y: z.number().min(0).max(12),
        })
      )
      .optional(),
  });

export const createFloorSchema = (isSqlite: boolean) =>
  z.object({
    name: z.string().min(minFloorNameLength),
    floor: z.number().int(),
  });
