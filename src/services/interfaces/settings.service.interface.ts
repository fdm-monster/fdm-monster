import { SettingsDto } from "@/services/interfaces/settings.dto";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  jwtSecretCredentialSettingUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema,
} from "@/services/validators/settings-service.validation";
import { z } from "zod";
import { Settings } from "@/entities";

export interface ISettingsService<Entity = Settings> {
  toDto(entity: Entity): SettingsDto;

  getOrCreate(): Promise<Entity>;

  updateFileCleanSettings(update: z.infer<typeof fileCleanSettingsUpdateSchema>): Promise<Entity>;

  updateWizardSettings(update: z.infer<typeof wizardUpdateSchema>): Promise<Entity>;

  updateFrontendSettings(update: z.infer<typeof frontendSettingsUpdateSchema>): Promise<Entity>;

  updateJwtSecretCredentialSetting(update: z.infer<typeof jwtSecretCredentialSettingUpdateSchema>): Promise<Entity>;

  updateCredentialSettings(update: z.infer<typeof credentialSettingUpdateSchema>): Promise<Entity>;

  updateServerSettings(update: z.infer<typeof serverSettingsUpdateSchema>): Promise<Entity>;

  updateTimeoutSettings(update: z.infer<typeof timeoutSettingsUpdateSchema>): Promise<Entity>;
}
