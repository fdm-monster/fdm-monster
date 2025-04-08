import { isProductionEnvironment } from "@/utils/env.utils";
import { z } from "zod";

export const serverSettingsUpdateSchema = z.object({
  registration: z.boolean().optional(),
  loginRequired: z.boolean().optional(),
  experimentalMoonrakerSupport: z.boolean().optional(),
  experimentalThumbnailSupport: z.boolean().optional(),
});

export const timeoutSettingsUpdateSchema = z.object({
  apiTimeout: z.number().int().min(1000),
});

export const frontendSettingsUpdateSchema = z.object({
  gridCols: z.number().int().min(1),
  gridRows: z.number().int().min(1),
  largeTiles: z.boolean(),
  tilePreferCancelOverQuickStop: z.boolean(),
});

export const credentialSettingPatchSchema = z.object({
  jwtSecret: z.string().optional(),
  jwtExpiresIn: z
    .number()
    .int()
    .min(isProductionEnvironment() ? 120 : 0)
    .max(isProductionEnvironment() ? 7200 : Infinity)
    .optional(),
  refreshTokenAttempts: z.number().int().min(-1).optional(),
  refreshTokenExpiry: z
    .number()
    .int()
    .min(isProductionEnvironment() ? 240 : 0)
    .optional(),
});

export const wizardUpdateSchema = z.object({
  wizardCompleted: z.boolean(),
  wizardCompletedAt: z.date().nullable(),
  wizardVersion: z.number().int().min(0),
});

export const fileCleanSettingsUpdateSchema = z.object({
  autoRemoveOldFilesBeforeUpload: z.boolean(),
  autoRemoveOldFilesAtBoot: z.boolean(),
  autoRemoveOldFilesCriteriumDays: z.number().int().min(0),
});

export const sentryDiagnosticsEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const moonrakerSupportSchema = z.object({
  enabled: z.boolean(),
});

export const thumbnailSupportSchema = z.object({
  enabled: z.boolean(),
});

export const clientNextSchema = z.object({
  enabled: z.boolean(),
});
