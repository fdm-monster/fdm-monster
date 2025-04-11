import { ISettings } from "@/models/Settings";
import { SettingsDto } from "@/services/interfaces/settings.dto";
import { IdType } from "@/shared.constants";
import { z } from "zod";
import {
  credentialSettingPatchSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema
} from "@/services/validators/settings-service.validation";

export interface ISettingsService<KeyType = IdType, Entity = ISettings> {
  toDto(entity: Entity): SettingsDto<KeyType>;

  getOrCreate(): Promise<Entity>;

  migrateSettingsRuntime(knownSettings: Partial<Entity>): any;

  patchFileCleanSettings(fileClean: z.infer<typeof fileCleanSettingsUpdateSchema>): Promise<Entity>;

  patchWizardSettings(patch: z.infer<typeof wizardUpdateSchema>): Promise<Entity>;

  updateFrontendSettings(patchUpdate: z.infer<typeof frontendSettingsUpdateSchema>): Promise<Entity>;

  patchCredentialSettings(patchUpdate: z.infer<typeof credentialSettingPatchSchema>): Promise<Entity>;

  patchServerSettings(patchUpdate: z.infer<typeof serverSettingsUpdateSchema>): Promise<Entity>;

  updateTimeoutSettings(patchUpdate: z.infer<typeof timeoutSettingsUpdateSchema>): Promise<Entity>;
}
