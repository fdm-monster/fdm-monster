import { Settings } from "@/models";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultCredentialSettings,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultSettings,
  getDefaultTimeout,
  getDefaultWizardSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey
} from "@/constants/server-settings.constants";
import { validateInput } from "@/handlers/validators";
import {
  credentialSettingPatchSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
  wizardUpdateSchema
} from "../validators/settings-service.validation";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { ISettings } from "@/models/Settings";
import { SettingsDto } from "@/services/interfaces/settings.dto";
import { MongoIdType } from "@/shared.constants";
import { z } from "zod";

export class SettingsService implements ISettingsService<MongoIdType> {
  toDto(entity: ISettings<MongoIdType>): SettingsDto<MongoIdType> {
    return {
      // Credential settings are not shared with the client
      [serverSettingsKey]: {
        ...entity[serverSettingsKey],
        experimentalTypeormSupport: false
      },
      [wizardSettingKey]: entity[wizardSettingKey],
      [frontendSettingKey]: entity[frontendSettingKey],
      [printerFileCleanSettingKey]: entity[printerFileCleanSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey]
    };
  }

  async getOrCreate() {
    let settings: ISettings | null = await Settings.findOne();
    if (!settings) {
      const defaultSettings = new Settings(getDefaultSettings());
      await defaultSettings.save();

      // Return to upper layer
      return defaultSettings;
    } else {
      // Perform patch of settings
      settings = this.migrateSettingsRuntime(settings);

      return (await Settings.findOneAndUpdate({ _id: settings.id }, settings, { new: true }))!;
    }
  }

  /**
   * Patch the given settings object manually - runtime migration strategy
   */
  migrateSettingsRuntime(knownSettings: Partial<ISettings>): ISettings {
    const doc = knownSettings; // alias _doc also works
    if (!doc[printerFileCleanSettingKey]) {
      doc[printerFileCleanSettingKey] = getDefaultFileCleanSettings();
    } else {
      // Remove superfluous settings
      doc[printerFileCleanSettingKey] = {
        autoRemoveOldFilesBeforeUpload: doc[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
        autoRemoveOldFilesAtBoot: doc[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
        autoRemoveOldFilesCriteriumDays: doc[printerFileCleanSettingKey].autoRemoveOldFilesCriteriumDays
      };
    }

    // Server settings exist, but need updating with new ones if they don't exist.
    if (!doc[wizardSettingKey]) {
      doc[wizardSettingKey] = getDefaultWizardSettings();
    }
    if (!doc[timeoutSettingKey]) {
      doc[timeoutSettingKey] = getDefaultTimeout();
    }
    if (!doc[serverSettingsKey]) {
      doc[serverSettingsKey] = getDefaultServerSettings();
    } else {
      // Remove superfluous settings
      doc[serverSettingsKey] = {
        loginRequired: doc[serverSettingsKey].loginRequired,
        registration: doc[serverSettingsKey].registration,
        experimentalClientSupport: doc[serverSettingsKey].experimentalClientSupport,
        experimentalMoonrakerSupport: doc[serverSettingsKey].experimentalMoonrakerSupport,
        sentryDiagnosticsEnabled: doc[serverSettingsKey].sentryDiagnosticsEnabled,
        experimentalThumbnailSupport: doc[serverSettingsKey].experimentalThumbnailSupport
      };
    }
    if (!doc[credentialSettingsKey]) {
      doc[credentialSettingsKey] = getDefaultCredentialSettings();
    }
    if (!doc[frontendSettingKey]) {
      doc[frontendSettingKey] = getDefaultFrontendSettings();
    }

    return doc as ISettings;
  }

  async patchFileCleanSettings(patchUpdate: z.infer<typeof fileCleanSettingsUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, fileCleanSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[printerFileCleanSettingKey] = Object.assign(settingsDoc[printerFileCleanSettingKey], validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }

  async patchWizardSettings(patchUpdate: z.infer<typeof wizardUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, wizardUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[wizardSettingKey] = Object.assign(settingsDoc[wizardSettingKey], validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }

  async updateFrontendSettings(patchUpdate: z.infer<typeof frontendSettingsUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, frontendSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const frontendSettings = settingsDoc[frontendSettingKey];
    Object.assign(frontendSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }

  async patchCredentialSettings(patchUpdate: z.infer<typeof credentialSettingPatchSchema>) {
    const validatedInput = await validateInput(patchUpdate, credentialSettingPatchSchema);

    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey];
    Object.assign(credentialSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }

  async patchServerSettings(patchUpdate: z.infer<typeof serverSettingsUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, serverSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const serverSettings = settingsDoc[serverSettingsKey];
    Object.assign(serverSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }

  async updateTimeoutSettings(patchUpdate: z.infer<typeof timeoutSettingsUpdateSchema>) {
    const validatedInput = await validateInput(patchUpdate, timeoutSettingsUpdateSchema);

    const settingsDoc = await this.getOrCreate();
    const timeoutSettings = settingsDoc[timeoutSettingKey];
    Object.assign(timeoutSettings, validatedInput);
    return (await Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true
    }))!;
  }
}
