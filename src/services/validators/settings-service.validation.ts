import { isProductionEnvironment } from "@/utils/env.utils";
import { z } from "zod";

export const serverSettingsUpdateSchema = z.object({
  registration: z.boolean(),
  loginRequired: z.boolean(),
  experimentalMoonrakerSupport: z.boolean(),
  experimentalBambuSupport: z.boolean(),
  experimentalPrusaLinkSupport: z.boolean(),
  sentryDiagnosticsEnabled: z.boolean(),
});

export const timeoutSettingsUpdateSchema = z.object({
  apiTimeout: z.number().int().min(1000),
  apiUploadTimeout: z.number().int().min(10000),
});

export const frontendSettingsUpdateSchema = z.object({
  gridCols: z.number().int().min(1),
  gridRows: z.number().int().min(1),
  largeTiles: z.boolean(),
  tilePreferCancelOverQuickStop: z.boolean(),
});

export const jwtSecretCredentialSettingUpdateSchema = z.object({
  jwtSecret: z.string().min(10),
});

export const credentialSettingUpdateSchema = z.object({
  jwtExpiresIn: z
    .number()
    .int()
    .min(isProductionEnvironment() ? 120 : 0)
    .max(isProductionEnvironment() ? 7200 : Infinity),
  refreshTokenAttempts: z.number().int().min(-1),
  refreshTokenExpiry: z
    .number()
    .int()
    .min(isProductionEnvironment() ? 240 : 0),
});

export const wizardUpdateSchema = z.object({
  wizardCompleted: z.boolean(),
  wizardCompletedAt: z.date().nullable(),
  wizardVersion: z.number().int().min(0),
});

export const sentryDiagnosticsEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const moonrakerSupportSchema = z.object({
  enabled: z.boolean(),
});

export const prusaLinkSupportSchema = z.object({
  enabled: z.boolean(),
});

export const bambuSupportSchema = z.object({
  enabled: z.boolean(),
});
