import { z } from "zod";
import {
  printerApiKeyValidator,
  printerEnabledValidator,
  printerNameValidator,
  printerTypeValidator,
  printerUrlValidator,
} from "@/services/validators/printer-service.validation";
import {
  floorLevelValidator,
  floorNameValidator,
  xValidator,
  yValidator,
} from "@/services/validators/floor-service.validation";

export const exportPrintersFloorsYamlSchema = z.object({
  exportPrinters: z.boolean(),
  exportFloorGrid: z.boolean(),
  exportFloors: z.boolean(),
  exportGroups: z.boolean(),
  printerComparisonStrategiesByPriority: z
    .array(z.string().refine((val) => ["name", "url", "id"].includes(val)))
    .min(1),
  floorComparisonStrategiesByPriority: z.string().refine((val) => ["name", "floor", "id"].includes(val)),
  notes: z.string().optional(),
});

export const numberOrStringIdValidator = z.union([z.number(), z.string()]);

export const printerPositionsSchema = z
  .array(
    z.object({
      printerId: numberOrStringIdValidator,
      floorId: numberOrStringIdValidator.optional(),
      x: xValidator,
      y: yValidator,
    }),
  )
  .min(0);

export const importPrinterPositionsSchema = z.object({
  printers: printerPositionsSchema.optional(),
});

export const importPrintersFloorsYamlSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.date().optional(),
  databaseType: z.enum(["mongo", "sqlite"]).default("mongo"),
  config: z.object({
    exportPrinters: z.boolean(),
    exportFloorGrid: z.boolean(),
    exportFloors: z.boolean(),
    exportGroups: z.boolean().optional(),
    printerComparisonStrategiesByPriority: z
      .array(z.string().refine((val) => ["name", "url", "id"].includes(val)))
      .min(1),
    floorComparisonStrategiesByPriority: z.string().refine((val) => ["name", "floor", "id"].includes(val)),
  }),
  printers: z
    .array(
      z.object({
        id: numberOrStringIdValidator,
        printerURL: printerUrlValidator,
        printerType: printerTypeValidator,
        apiKey: printerApiKeyValidator,
        enabled: printerEnabledValidator,
        name: printerNameValidator,
        // Legacy properties
        printerName: z.string().optional(),
        settingsAppearance: z
          .object({
            name: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(0)
    .default([]),
  floors: z
    .array(
      z.object({
        id: numberOrStringIdValidator,
        floor: floorLevelValidator,
        name: floorNameValidator,
        printers: printerPositionsSchema,
      }),
    )
    .min(0)
    .default([]),
  groups: z
    .array(
      z.object({
        id: numberOrStringIdValidator,
        name: z.string(),
        printers: z.array(
          z.object({
            printerId: numberOrStringIdValidator,
          }),
        ),
      }),
    )
    .min(0)
    .default([]),
});

export type YamlExportSchema = z.infer<typeof importPrintersFloorsYamlSchema>;
