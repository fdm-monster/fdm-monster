import {
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { z } from "zod";
import {
  credentialSettingSchema,
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
  experimentalPrusaLinkSupport: boolean;
}

export type WizardSettingsDto = z.infer<typeof wizardUpdateSchema>;

export type FrontendSettingsDto = z.infer<typeof frontendSettingsUpdateSchema>;

export type CredentialSettingsDto = z.infer<typeof credentialSettingSchema>;

export type TimeoutSettingsDto = z.infer<typeof timeoutSettingsUpdateSchema>;

export class SettingsDto {
  [serverSettingsKey]: ServerSettingsDto;
  [wizardSettingKey]: WizardSettingsDto;
  [frontendSettingKey]: FrontendSettingsDto;
  // [credentialSettingsKey]: CredentialSettingsDto;
  [timeoutSettingKey]: TimeoutSettingsDto;
}
