import { z } from "zod";
import {
  printerApiKeyValidator,
  printerEnabledValidator,
  printerNameValidator,
  printerPasswordValidator,
  printerTypeValidator,
  printerUrlValidator,
  printerUsernameValidator,
} from "@/services/validators/printer-service.validation";
import {
  floorOrderValidator,
  floorNameValidator,
  xValidator,
  yValidator,
} from "@/services/validators/floor-service.validation";

export const exportPrintersFloorsYamlSchema = z.object({
  exportPrinters: z.boolean(),
  exportFloorGrid: z.boolean(),
  exportFloors: z.boolean(),
  exportTags: z.boolean(),
  // Legacy field for backward compatibility
  exportGroups: z.boolean().optional(),
  exportSettings: z.boolean().default(false),
  exportUsers: z.boolean().default(false),
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
  databaseType: z.enum(["mongo", "sqlite"]).default("sqlite"),
  config: z.object({
    exportPrinters: z.boolean(),
    exportFloorGrid: z.boolean(),
    exportFloors: z.boolean(),
    exportTags: z.boolean().optional(),
    // Legacy field for backward compatibility
    exportGroups: z.boolean().optional(),
    exportSettings: z.boolean().optional().default(false),
    exportUsers: z.boolean().optional().default(false),
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
        order: floorOrderValidator,
        // Legacy property
        floor: floorOrderValidator.optional(),
        name: floorNameValidator,
        printers: printerPositionsSchema,
      }),
    )
    .min(0)
    .default([]),
  tags: z
    .array(
      z.object({
        id: numberOrStringIdValidator,
        name: z.string(),
        color: z.string().optional(),
        printers: z.array(
          z.object({
            printerId: numberOrStringIdValidator,
          }),
        ),
      }),
    )
    .min(0)
    .default([]),
  settings: z.any().optional(),
  users: z
    .array(
      z.object({
        id: numberOrStringIdValidator,
        username: z.string(),
        isDemoUser: z.boolean().optional(),
        isRootUser: z.boolean().optional(),
        isVerified: z.boolean().optional(),
        needsPasswordChange: z.boolean().optional(),
        passwordHash: z.string(),
        createdAt: z.date().optional(),
        roles: z.array(z.any()).optional(),
      }),
    )
    .optional()
    .default([]),
});

export type YamlExportSchema = z.infer<typeof importPrintersFloorsYamlSchema>;
