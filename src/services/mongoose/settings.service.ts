import { Settings } from "@/models";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { validateInput } from "@/handlers/validators";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  jwtSecretCredentialSettingUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema,
} from "../validators/settings-service.validation";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { ISettings } from "@/models/Settings";
import { SettingsDto } from "@/services/interfaces/settings.dto";
import { MongoIdType } from "@/shared.constants";
import { z } from "zod";
import { migrateSettingsRuntime } from "@/shared/runtime-settings.migration";

export class SettingsService implements ISettingsService<MongoIdType> {
  toDto(entity: ISettings): SettingsDto {
    return {
      // Credential settings are not shared with the client
      [serverSettingsKey]: {
        ...entity[serverSettingsKey],
        experimentalTypeormSupport: false,
      },
      [wizardSettingKey]: entity[wizardSettingKey],
      [frontendSettingKey]: entity[frontendSettingKey],
      [printerFileCleanSettingKey]: entity[printerFileCleanSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey],
    };
  }

  async getOrCreate() {
    let settings: ISettings | null = await this.getOptional();
    if (!settings) {
      const defaultSettings = new Settings(getDefaultSettings());
      await defaultSettings.save();

      // Return to upper layer
      return defaultSettings;
    } else {
      // Perform patch of settings
      settings = migrateSettingsRuntime(settings);

      return (await Settings.findOneAndUpdate({ _id: settings.id }, settings, { new: true }))!;
    }
  }

  async updateFileCleanSettings(update: z.infer<typeof fileCleanSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, fileCleanSettingsUpdateSchema);
    const settingsDoc = await this.getOrCreate();
    settingsDoc[printerFileCleanSettingKey] = Object.assign(settingsDoc[printerFileCleanSettingKey], validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateWizardSettings(update: z.infer<typeof wizardUpdateSchema>) {
    const validatedInput = await validateInput(update, wizardUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[wizardSettingKey] = Object.assign(settingsDoc[wizardSettingKey], validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateFrontendSettings(update: z.infer<typeof frontendSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, frontendSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const frontendSettings = settingsDoc[frontendSettingKey];
    Object.assign(frontendSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateJwtSecretCredentialSetting(update: z.infer<typeof jwtSecretCredentialSettingUpdateSchema>) {
    const validatedInput = await validateInput(update, jwtSecretCredentialSettingUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey];
    Object.assign(credentialSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateCredentialSettings(patchUpdate: z.infer<typeof credentialSettingUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, credentialSettingUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey];
    Object.assign(credentialSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateServerSettings(update: z.infer<typeof serverSettingsUpdateSchema>) {
    const validatedInput = await validateInput(update, serverSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const serverSettings = settingsDoc[serverSettingsKey];
    Object.assign(serverSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  async updateTimeoutSettings(patchUpdate: z.infer<typeof timeoutSettingsUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, timeoutSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const timeoutSettings = settingsDoc[timeoutSettingKey];
    Object.assign(timeoutSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    }))!;
  }

  private async getOptional(): Promise<ISettings | null> {
    return Settings.findOne();
  }
}
