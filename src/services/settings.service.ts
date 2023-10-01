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
  credentialSettingUpdateRules,
  frontendSettingsUpdateRules,
  serverSettingsUpdateRules,
  whitelistUpdateRules,
  wizardUpdateRules,
} from "./validators/settings-service.validation";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { ICredentialSettings, IFrontendSettings, IServerSettings, IWizardSettings } from "@/models/Settings";

export class SettingsService implements ISettingsService {
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
  migrateSettingsRuntime(knownSettings) {
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
    if (!doc.server.whitelistedIpAddresses?.length) {
      doc.server.whitelistedIpAddresses = getDefaultWhitelistIpAddresses();
    }
    if (!doc[frontendSettingKey]) {
      doc[frontendSettingKey] = getDefaultFrontendSettings();
    }

    return knownSettings;
  }

  async setSentryDiagnosticsEnabled(enabled: boolean) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].sentryDiagnosticsEnabled = enabled;

    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async patchWizardSettings(patchUpdate: Partial<IWizardSettings>) {
    const validatedInput = validateInput(patchUpdate, wizardUpdateRules);

    const settingsDoc = await this.getOrCreate();
    settingsDoc[wizardSettingKey] = Object.assign(settingsDoc[wizardSettingKey], validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setRegistrationEnabled(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].registration = enabled;

    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setLoginRequired(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].loginRequired = enabled;

    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setWhitelist(enabled: boolean, ipAddresses: string[]) {
    await validateInput(
      {
        enabled,
        ipAddresses,
      },
      whitelistUpdateRules
    );
    const settingsDoc = await this.getOrCreate();
    const settings = settingsDoc[serverSettingsKey];
    settings.whitelistEnabled = enabled;
    settings.whitelistedIpAddresses = ipAddresses;
    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async updateFrontendSettings(patchUpdate: IFrontendSettings) {
    const validatedInput = await validateInput(patchUpdate, frontendSettingsUpdateRules);

    const settingsDoc = await this.getOrCreate();
    const frontendSettings = settingsDoc[frontendSettingKey];
    Object.assign(frontendSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>) {
    const validatedInput = await validateInput(patchUpdate, credentialSettingUpdateRules);

    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey];
    Object.assign(credentialSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async patchServerSettings(patchUpdate: Partial<IServerSettings>) {
    const validatedInput = await validateInput(patchUpdate, serverSettingsUpdateRules);

    const settingsDoc = await this.getOrCreate();
    const serverSettings = settingsDoc[serverSettingsKey];
    Object.assign(serverSettings, validatedInput);
    return Settings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }
}
