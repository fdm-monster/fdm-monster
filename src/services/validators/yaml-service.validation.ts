import { apiKeyLengthMaxDefault, apiKeyLengthMinDefault } from "@/constants/service.constants";
import { PrinterTypes } from "@/services/printer-api.interface";
import { z } from "zod";
import { numberEnum } from "@/handlers/validators";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const exportPrintersFloorsYamlSchema = z.object({
  exportPrinters: z.boolean(),
  exportFloorGrid: z.boolean(),
  exportFloors: z.boolean(),
  exportGroups: z.boolean(),
  printerComparisonStrategiesByPriority: z
    .array(
      z.string().refine((val) => ["name", "url", "id"].includes(val), {
        message: "Must be one of: name, url, id",
      })
    )
    .min(1),
  floorComparisonStrategiesByPriority: z.string().refine((val) => ["name", "floor", "id"].includes(val), {
    message: "Must be one of: name, floor, id",
  }),
  notes: z.string().optional(),
});

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
              id: z.union([z.number(), z.string()]),
              apiKey: z
                .string()
                .min(apiKeyLengthMinDefault)
                .max(apiKeyLengthMaxDefault)
                .regex(/^[a-zA-Z0-9_-]+$/),
              printerURL: z.string().url(),
              enabled: z.boolean().optional(),
              printerType: z.number().superRefine(numberEnum(PrinterTypes)),
              name: z.string(),
            })
          )
          .min(0)
      : z.array(z.any()).optional(),
    floors: importFloors
      ? z
          .array(
            z.object({
              id: z.union([z.number(), z.string()]),
              floor: z.number().int(),
              name: z.string(),
              printers: z.array(
                z.object({
                  printerId: z.union([z.number(), z.string()]),
                  // Added on multiple places
                  floorId: z.union([z.number(), z.string()]).optional(),
                  x: z.number().int().min(0).max(12),
                  y: z.number().int().min(0).max(12),
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
              id: z.union([z.number(), z.string()]),
              name: z.string(),
              printers: z.array(
                z.object({
                  printerId: z.union([z.number(), z.string()]),
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
          printerId: z.union([z.number(), z.string()]),
          floorId: z.union([z.number(), z.string()]).optional(),
          x: z.number().int().min(0).max(12),
          y: z.number().int().min(0).max(12),
        })
      )
      .min(0)
      .optional(),
  });
