import {
  frontendSettingKey,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { z } from "zod";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema,
} from "@/services/validators/settings-service.validation";

export interface ServerSettingsDto {
  sentryDiagnosticsEnabled: boolean;
  registration: boolean;
  loginRequired: boolean;
  experimentalMoonrakerSupport: boolean;
  experimentalBambuSupport: boolean;
  experimentalClientSupport: boolean;
  experimentalThumbnailSupport: boolean;
  experimentalPrusaLinkSupport: boolean;
}

export type WizardSettingsDto = z.infer<typeof wizardUpdateSchema>;

export type FrontendSettingsDto = z.infer<typeof frontendSettingsUpdateSchema>;

export type FileCleanSettingsDto = z.infer<typeof fileCleanSettingsUpdateSchema>;

export type CredentialSettingsDto = z.infer<typeof credentialSettingUpdateSchema>;

export type TimeoutSettingsDto = z.infer<typeof timeoutSettingsUpdateSchema>;

export class SettingsDto {
  [serverSettingsKey]: ServerSettingsDto;
  [wizardSettingKey]: WizardSettingsDto;
  [frontendSettingKey]: FrontendSettingsDto;
  // [credentialSettingsKey]: CredentialSettingsDto;
  [printerFileCleanSettingKey]: FileCleanSettingsDto;
  [timeoutSettingKey]: TimeoutSettingsDto;
}
