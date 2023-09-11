const SettingsModel = require("../models/ServerSettings.js");
const Constants = require("../constants/server-settings.constants");
const { validateInput } = require("../handlers/validators");
const {
  serverSettingsUpdateRules,
  frontendSettingsUpdateRules,
  credentialSettingUpdateRules,
} = require("./validators/settings-service.validation");
const {
  fileCleanSettingKey,
  serverSettingsKey,
  frontendSettingKey,
  credentialSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} = require("../constants/server-settings.constants");
const { AppConstants } = require("../server.constants");

class SettingsService {
  async getOrCreate() {
    let settings = await SettingsModel.findOne();
    if (!settings) {
      const defaultSettings = new SettingsModel(Constants.getDefaultSettings());
      await defaultSettings.save();

      // Return to upper layer
      return defaultSettings;
    } else {
      // Perform patch of settings
      settings = this.migrateSettingsRuntime(settings);

      return SettingsModel.findOneAndUpdate({ _id: settings.id }, settings, { new: true });
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
      doc[fileCleanSettingKey] = Constants.getDefaultFileCleanSettings();
    }

    // Server settings exist, but need updating with new ones if they don't exist.
    if (!doc[wizardSettingKey]) {
      doc[wizardSettingKey] = Constants.getDefaultWizardSettings();
    }
    if (!doc[timeoutSettingKey]) {
      doc[timeoutSettingKey] = Constants.getDefaultTimeout();
    }
    if (!doc[serverSettingsKey]) {
      doc[serverSettingsKey] = Constants.getDefaultServerSettings();
    }
    if (!doc[credentialSettingsKey]) {
      doc[credentialSettingsKey] = Constants.getDefaultCredentialSettings();
    }
    if (!doc.server.whitelistedIpAddresses?.length) {
      doc.server.whitelistedIpAddresses = Constants.getDefaultWhitelistIpAddresses();
    }
    if (!doc[frontendSettingKey]) {
      doc[frontendSettingKey] = Constants.getDefaultFrontendSettings();
    }

    return knownSettings;
  }

  async setSentryDiagnosticsEnabled(enabled) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].sentryDiagnosticsEnabled = enabled;
    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
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

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setRegistrationEnabled(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].registration = enabled;

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setLoginRequired(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc[serverSettingsKey].loginRequired = enabled;

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
      new: true,
    });
  }

  async setWhitelist(enabled, ipAddresses) {
    const settingsDoc = await this.getOrCreate();
    const settings = settingsDoc[serverSettingsKey];
    settings.whitelistEnabled = enabled;
    settings.whitelistedIpAddresses = ipAddresses;

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, settingsDoc, {
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

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput, {
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

    return SettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput, {
      new: true,
    });
  }

  async updateServerSettings(patchUpdate) {
    const validatedInput = await validateInput(patchUpdate, serverSettingsUpdateRules);
    const settingsDoc = await this.getOrCreate();

    return SettingsModel.findOneAndUpdate(
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

module.exports = {
  SettingsService,
};
