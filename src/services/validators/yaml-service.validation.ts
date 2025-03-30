import { z } from "zod";
import {
  printerApiKeyValidator,
  printerEnabledValidator,
  printerNameValidator,
  printerTypeValidator,
  printerUrlValidator,
} from "@/services/validators/printer-service.validation";
import { floorLevelValidator, floorNameValidator, xValidator, yValidator } from "@/services/validators/floor-service.validation";

export const exportPrintersFloorsYamlSchema = z.object({
  exportPrinters: z.boolean(),
  exportFloorGrid: z.boolean(),
  exportFloors: z.boolean(),
  exportGroups: z.boolean(),
  printerComparisonStrategiesByPriority: z.array(z.string().refine((val) => ["name", "url", "id"].includes(val))).min(1),
  floorComparisonStrategiesByPriority: z.string().refine((val) => ["name", "floor", "id"].includes(val)),
  notes: z.string().optional(),
});

export const numberOrStringIdValidator = z.union([z.number(), z.string()]);

export const importPrintersFloorsYamlSchema = (
  importPrinters: boolean,
  importFloorGrid: boolean,
  importFloors: boolean,
  importGroups: boolean
) =>
  z.object({
    version: z.string(),
    config: z.object({
      exportPrinters: z.boolean(),
      exportFloorGrid: z.boolean(),
      exportFloors: z.boolean(),
      exportGroups: z.boolean().optional(),
      printerComparisonStrategiesByPriority: z.array(z.string().refine((val) => ["name", "url", "id"].includes(val))).min(1),
      floorComparisonStrategiesByPriority: z.string().refine((val) => ["name", "floor", "id"].includes(val)),
    }),
    printers: importPrinters
      ? z
          .array(
            z.object({
              id: numberOrStringIdValidator,
              printerURL: printerUrlValidator,
              printerType: printerTypeValidator,
              apiKey: printerApiKeyValidator,
              enabled: printerEnabledValidator,
              name: printerNameValidator,
            })
          )
          .min(0)
      : z.array(z.any()).optional(),
    floors: importFloors
      ? z
          .array(
            z.object({
              id: numberOrStringIdValidator,
              floor: floorLevelValidator,
              name: floorNameValidator,
              printers: z.array(
                z.object({
                  printerId: numberOrStringIdValidator,
                  // Added on multiple places
                  floorId: numberOrStringIdValidator.optional(),
                  x: xValidator,
                  y: yValidator,
                })
              ),
            })
          )
          .min(0)
      : z.array(z.any()).optional(),
    groups: importGroups
      ? z
          .array(
            z.object({
              id: numberOrStringIdValidator,
              name: z.string(),
              printers: z.array(
                z.object({
                  printerId: numberOrStringIdValidator,
                })
              ),
            })
          )
          .min(0)
      : z.array(z.any()).optional(),
  });

export const importPrinterPositionsSchema = (isSqliteMode: boolean) =>
  z.object({
    printers: z
      .array(
        z.object({
          printerId: numberOrStringIdValidator,
          floorId: numberOrStringIdValidator.optional(),
          x: xValidator,
          y: yValidator,
        })
      )
      .min(0)
      .optional(),
  });
