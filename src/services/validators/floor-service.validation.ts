import { z } from "zod";
import { minFloorNameLength } from "@/constants/service.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const removePrinterInFloorSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite),
  });

export const xValidator = z.number().int().min(0).max(12);
export const yValidator = z.number().int().min(0).max(12);
export const floorLevelValidator = z.number().int();
export const floorNameValidator = z.string().min(minFloorNameLength);

export const printerInFloorSchema = (isSqlite: boolean) =>
  z.object({
    printerId: idRuleV2(isSqlite),
    floorId: idRuleV2(isSqlite),
    x: xValidator,
    y: yValidator,
  });

export const updateFloorNameSchema = z.object({
  name: floorNameValidator,
});

export const updateFloorLevelSchema = z.object({
  floor: floorLevelValidator,
});

export const createOrUpdateFloorSchema = (isSqlite: boolean) =>
  z.object({
    name: floorNameValidator,
    floor: floorLevelValidator,
    printers: z
      .array(
        z.object({
          printerId: idRuleV2(isSqlite),
          floorId: idRuleV2(isSqlite).optional(),
          x: xValidator,
          y: yValidator,
        }),
      )
      .optional(),
  });
