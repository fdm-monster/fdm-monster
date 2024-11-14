import { ICredentialSettings, IFrontendSettings, IServerSettings, ISettings, IWizardSettings } from "@/models/Settings";
import { FileCleanSettingsDto, SettingsDto, TimeoutSettingsDto } from "@/services/interfaces/settings.dto";
import { IdType } from "@/shared.constants";

export interface ISettingsService<KeyType = IdType, Entity = ISettings> {
  toDto(entity: Entity): SettingsDto<KeyType>;

  getOrCreate(): Promise<Entity>;

  migrateSettingsRuntime(knownSettings: Partial<Entity>): any;

  patchFileCleanSettings(fileClean: Partial<FileCleanSettingsDto>): Promise<Entity>;

  patchWizardSettings(patch: Partial<IWizardSettings>): Promise<Entity>;

  updateFrontendSettings(patchUpdate: IFrontendSettings): Promise<Entity>;

  patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>): Promise<Entity>;

  patchServerSettings(patchUpdate: Partial<IServerSettings>): Promise<Entity>;

  updateTimeoutSettings(patchUpdate: TimeoutSettingsDto): Promise<Entity>;
}
