import { ServerSettings } from "@/models";
import {
  getDefaultCredentialSettings,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultSettings,
  getDefaultTimeout,
  getDefaultWhitelistIpAddresses,
  getDefaultWizardSettings,
} from "@/constants/server-settings.constants";
import { validateInput } from "@/handlers/validators";
import {
  serverSettingsUpdateRules,
  frontendSettingsUpdateRules,
  credentialSettingUpdateRules,
} from "./validators/settings-service.validation";
import {
  fileCleanSettingKey,
  serverSettingsKey,
  frontendSettingKey,
  credentialSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";

export class SettingsService {
  async getOrCreate() {
    let settings = await ServerSettings.findOne();
    if (!settings) {
      const defaultSettings = new ServerSettings(getDefaultSettings());
      await defaultSettings.save();

      // Return to upper layer
      return defaultSettings;
    } else {
      // Perform patch of settings
      settings = this.migrateSettingsRuntime(settings);

      return ServerSettings.findOneAndUpdate({ _id: settings.id }, settings, { new: true });
    }
  }

  /**
   * @private
   * Patch the given settings object manually - runtime migration strategy
   * @param knownSettings
   * @returns {*}
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

  async setSentryDiagnosticsEnabled(enabled) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].sentryDiagnosticsEnabled = enabled;
    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  /**
   * @param version {number}
   * @return {Promise<any>}
   */
  async setWizardCompleted(version) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[wizardSettingKey].wizardCompleted = true;
    settingsDoc[wizardSettingKey].wizardCompletedAt = new Date();
    settingsDoc[wizardSettingKey].wizardVersion = version;

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setRegistrationEnabled(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].registration = enabled;

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setLoginRequired(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].loginRequired = enabled;

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setWhitelist(enabled, ipAddresses) {
    const settingsDoc = await this.getOrCreate();
    const settings = settingsDoc[serverSettingsKey];
    settings.whitelistEnabled = enabled;
    settings.whitelistedIpAddresses = ipAddresses;

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async updateFrontendSettings(patchUpdate) {
    const validatedInput = await validateInput(
      {
        [frontendSettingKey]: patchUpdate,
      },
      frontendSettingsUpdateRules
    );
    const settingsDoc = await this.getOrCreate();

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput, {
      new: true,
    });
  }

  async updateCredentialSettings(patchUpdate) {
    const settingsDoc = await this.getOrCreate();
    const credentialSettings = settingsDoc[credentialSettingsKey]._doc;

    Object.assign(credentialSettings, patchUpdate);
    const validatedInput = await validateInput(
      {
        [credentialSettingsKey]: credentialSettings,
      },
      credentialSettingUpdateRules
    );

    return ServerSettings.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput, {
      new: true,
    });
  }

  async updateServerSettings(patchUpdate) {
    const validatedInput = await validateInput(patchUpdate, serverSettingsUpdateRules);
    const settingsDoc = await this.getOrCreate();

    return ServerSettings.findOneAndUpdate(
      { _id: settingsDoc._id },
      {
        [serverSettingsKey]: validatedInput,
      },
      {
        new: true,
      }
    );
  }
}
