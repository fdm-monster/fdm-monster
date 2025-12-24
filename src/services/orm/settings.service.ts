import { Settings } from "@/entities";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { BaseService } from "@/services/orm/base.service";
import { SettingsDto } from "../interfaces/settings.dto";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { z } from "zod";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  jwtSecretCredentialSettingUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema,
} from "@/services/validators/settings-service.validation";
import { migrateSettingsRuntime } from "@/shared/runtime-settings.migration";
import { validateInput } from "@/handlers/validators";

export class SettingsService
  extends BaseService(Settings, SettingsDto)
  implements ISettingsService
{
  toDto(entity: Settings): SettingsDto {
    return {
      [serverSettingsKey]: entity[serverSettingsKey],
      [frontendSettingKey]: entity[frontendSettingKey],
      [printerFileCleanSettingKey]: entity[printerFileCleanSettingKey],
      [wizardSettingKey]: entity[wizardSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey],
    };
  }

  async getOrCreate() {
    let settings = await this.getOptional();

    if (settings) {
      settings = migrateSettingsRuntime(settings);

      const settingsId = settings.id;
      return await this.update(settingsId, settings);
    } else {
      return await this.create(getDefaultSettings());
    }
  }

  async updateServerSettings(update: z.infer<typeof serverSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, serverSettingsUpdateSchema);
    const entity = await this.getOrCreate();
    entity[serverSettingsKey] = validatedInput;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateJwtSecretCredentialSetting(update: z.infer<typeof jwtSecretCredentialSettingUpdateSchema>) {
    const validatedInput = await validateInput(update, jwtSecretCredentialSettingUpdateSchema);
    const entity = await this.getOrCreate();
    entity[credentialSettingsKey].jwtSecret = validatedInput.jwtSecret;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateCredentialSettings(update: z.infer<typeof credentialSettingUpdateSchema>) {
    const validatedInput = await validateInput(update, credentialSettingUpdateSchema);
    const entity = await this.getOrCreate();
    entity[credentialSettingsKey].refreshTokenExpiry = validatedInput.refreshTokenExpiry;
    entity[credentialSettingsKey].refreshTokenAttempts = validatedInput.refreshTokenAttempts;
    entity[credentialSettingsKey].jwtExpiresIn = validatedInput.jwtExpiresIn;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFileCleanSettings(update: z.infer<typeof fileCleanSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, fileCleanSettingsUpdateSchema);
    const entity = await this.getOrCreate();
    entity[printerFileCleanSettingKey] = validatedInput;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFrontendSettings(update: z.infer<typeof frontendSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, frontendSettingsUpdateSchema);
    const entity = await this.getOrCreate();
    entity[frontendSettingKey] = validatedInput;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateTimeoutSettings(update: z.infer<typeof timeoutSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, timeoutSettingsUpdateSchema);
    const entity = await this.getOrCreate();
    entity[timeoutSettingKey] = validatedInput;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateWizardSettings(update: z.infer<typeof wizardUpdateSchema>) {
    const validatedInput = await validateInput(update, wizardUpdateSchema);
    const entity = await this.getOrCreate();
    entity[wizardSettingKey] = validatedInput;
    await this.update(entity.id, entity);
    return entity;
  }

  private async getOptional(): Promise<Settings | null> {
    const settingsList = await this.repository.find({ take: 1 });
    return settingsList?.length ? settingsList[0] : null;
  }
}
