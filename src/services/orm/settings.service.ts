import { Settings } from "@/entities";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey
} from "@/constants/server-settings.constants";
import { BaseService } from "@/services/orm/base.service";
import { SettingsDto } from "../interfaces/settings.dto";
import { SqliteIdType } from "@/shared.constants";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { z } from "zod";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  jwtSecretCredentialSettingUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema
} from "@/services/validators/settings-service.validation";
import { migrateSettingsRuntime } from "@/shared/runtime-settings.migration";

export class SettingsService
  extends BaseService(Settings, SettingsDto)
  implements ISettingsService<SqliteIdType, Settings> {
  toDto(entity: Settings): SettingsDto {
    return {
      [serverSettingsKey]: {
        ...entity[serverSettingsKey],
        experimentalTypeormSupport: true
      },
      [frontendSettingKey]: entity[frontendSettingKey],
      [printerFileCleanSettingKey]: entity[printerFileCleanSettingKey],
      [wizardSettingKey]: entity[wizardSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey]
    };
  }

  async getOrCreate() {
    let settings = await this.getOptional();

    if (!settings) {
      return await this.create(getDefaultSettings());
    } else {
      settings = migrateSettingsRuntime(settings);

      const settingsId = settings.id;
      return await this.update(settingsId, settings);
    }
  }

  async getServerSettings() {
    const settings = await this.getOrCreate();
    return settings[serverSettingsKey];
  }

  async updateServerSettings(serverSettings: z.infer<typeof serverSettingsUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey] = serverSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateJwtSecretCredentialSetting(update: z.infer<typeof jwtSecretCredentialSettingUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[credentialSettingsKey].jwtSecret = update.jwtSecret;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateCredentialSettings(credentialSettings: z.infer<typeof credentialSettingUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[credentialSettingsKey].refreshTokenExpiry = credentialSettings.refreshTokenExpiry;
    entity[credentialSettingsKey].refreshTokenAttempts = credentialSettings.refreshTokenAttempts;
    entity[credentialSettingsKey].jwtExpiresIn = credentialSettings.jwtExpiresIn;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFileCleanSettings(fileCleanSettings: z.infer<typeof fileCleanSettingsUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[printerFileCleanSettingKey] = fileCleanSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFrontendSettings(frontendSettings: z.infer<typeof frontendSettingsUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[frontendSettingKey] = frontendSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateTimeoutSettings(timeoutSettings: z.infer<typeof timeoutSettingsUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[timeoutSettingKey] = timeoutSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateWizardSettings(wizardSettings: z.infer<typeof wizardUpdateSchema>) {
    const entity = await this.getOrCreate();
    entity[wizardSettingKey] = wizardSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async getOptional() {
    const settingsList = await this.repository.find({ take: 1 });
    return settingsList?.length ? settingsList[0] : null;
  }

  async setLoginRequired(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].loginRequired = enabled;
    await this.update(entity.id, entity);
    return entity;
  }

  async setRegistrationEnabled(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].registration = enabled;
    await this.update(entity.id, entity);
    return entity;
  }

  async setSentryDiagnosticsEnabled(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].sentryDiagnosticsEnabled = enabled;
    await this.update(entity.id, entity);
    return entity;
  }
}
