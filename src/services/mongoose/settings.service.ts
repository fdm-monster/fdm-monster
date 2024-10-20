import { Settings } from "@/models";
import {
  credentialSettingsKey,
  fileCleanSettingKey,
  frontendSettingKey,
  getDefaultCredentialSettings,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultSettings,
  getDefaultTimeout,
  getDefaultWhitelistIpAddresses,
  getDefaultWizardSettings,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { validateInput } from "@/handlers/validators";
import {
  credentialSettingPatchRules,
  fileCleanSettingsUpdateRules,
  frontendSettingsUpdateRules,
  serverSettingsUpdateRules,
  timeoutSettingsUpdateRules,
  whitelistSettingUpdateRules,
  wizardUpdateRules,
} from "../validators/settings-service.validation";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import {
  ICredentialSettings,
  IFileCleanSettings,
  IFrontendSettings,
  IServerSettings,
  ISettings,
  ITimeoutSettings,
  IWizardSettings,
} from "@/models/Settings";
import { SettingsDto } from "@/services/interfaces/settings.dto";
import { MongoIdType } from "@/shared.constants";
import { AppConstants } from "@/server.constants";
import { ConfigService } from "@/services/core/config.service";
import { BadRequestException } from "@/exceptions/runtime.exceptions";

export class SettingsService implements ISettingsService<MongoIdType, ISettings> {
  configService: ConfigService;
  constructor({ configService }: { configService: ConfigService }) {
    this.configService = configService;
  }

  toDto(entity: ISettings): SettingsDto<MongoIdType> {
    return {
      // Credential settings are not shared with the client
      [serverSettingsKey]: entity[serverSettingsKey],
      [wizardSettingKey]: entity[wizardSettingKey],
      [frontendSettingKey]: entity[frontendSettingKey],
      [fileCleanSettingKey]: entity[fileCleanSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey],
    };
  }

  async getOrCreate() {
    let settings = await Settings.findOne();
    if (!settings) {
      const defaultSettings = new Settings(getDefaultSettings());
      await defaultSettings.save();

      // Return to upper layer
      return defaultSettings;
    } else {
      // Perform patch of settings
      settings = this.migrateSettingsRuntime(settings);

      return Settings.findOneAndUpdate({ _id: settings.id }, settings, { new: true });
    }
  }

  /**
   * Patch the given settings object manually - runtime migration strategy
   */
  migrateSettingsRuntime(knownSettings: Partial<SettingsDto<MongoIdType>>) {
    const doc = knownSettings; // alias _doc also works
    if (!doc[fileCleanSettingKey]) {
      doc[fileCleanSettingKey] = getDefaultFileCleanSettings();
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
    }
    if (!doc[credentialSettingsKey]) {
      doc[credentialSettingsKey] = getDefaultCredentialSettings();
    }
    if (!this.isWhiteListSettingEnabled()) {
      doc.server.whitelistEnabled = false;
      doc.server.whitelistedIpAddresses = getDefaultWhitelistIpAddresses();
    } else if (!doc.server.whitelistedIpAddresses?.length) {
      doc.server.whitelistedIpAddresses = getDefaultWhitelistIpAddresses();
    }
    if (!doc[frontendSettingKey]) {
      doc[frontendSettingKey] = getDefaultFrontendSettings();
    }

    return knownSettings;
  }

  async patchFileCleanSettings(patchUpdate: Partial<IFileCleanSettings>) {
    const validatedInput = await validateInput(patchUpdate, fileCleanSettingsUpdateRules);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[fileCleanSettingKey] = Object.assign(settingsDoc[fileCleanSettingKey], validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async patchWizardSettings(patchUpdate: Partial<IWizardSettings>) {
    const validatedInput = await validateInput(patchUpdate, wizardUpdateRules);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[wizardSettingKey] = Object.assign(settingsDoc[wizardSettingKey], validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async setWhitelist(enabled: boolean, ipAddresses: string[]) {
    if (!this.isWhiteListSettingEnabled()) {
      throw new BadRequestException("Whitelist settings are not enabled");
    }

    await validateInput(
      {
        whitelistEnabled: enabled,
        whitelistedIpAddresses: ipAddresses,
      },
      whitelistSettingUpdateRules
    );
    const settingsDoc = await this.getOrCreate();
    const settings = settingsDoc[serverSettingsKey];
    settings.whitelistEnabled = enabled;
    settings.whitelistedIpAddresses = ipAddresses;
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async updateFrontendSettings(patchUpdate: IFrontendSettings) {
    const validatedInput = await validateInput(patchUpdate, frontendSettingsUpdateRules);

    const settingsDoc = await this.getOrCreate();
    const frontendSettings = settingsDoc[frontendSettingKey];
    Object.assign(frontendSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>) {
    const validatedInput = await validateInput(patchUpdate, credentialSettingPatchRules);

    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey];
    Object.assign(credentialSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async patchServerSettings(patchUpdate: Partial<IServerSettings>) {
    const validatedInput = await validateInput(patchUpdate, serverSettingsUpdateRules(this.isWhiteListSettingEnabled()));

    const settingsDoc = await this.getOrCreate();
    const serverSettings = settingsDoc[serverSettingsKey];
    Object.assign(serverSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  async updateTimeoutSettings(patchUpdate: Partial<ITimeoutSettings>) {
    const validatedInput = await validateInput(patchUpdate, timeoutSettingsUpdateRules);

    const settingsDoc = await this.getOrCreate();
    const timeoutSettings = settingsDoc[timeoutSettingKey];
    Object.assign(timeoutSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc.id }, settingsDoc, {
      new: true,
    });
  }

  isWhiteListSettingEnabled() {
    return this.configService.get(AppConstants.ENABLE_EXPERIMENTAL_WHITELIST_SETTINGS, "false") === "true";
  }
}
