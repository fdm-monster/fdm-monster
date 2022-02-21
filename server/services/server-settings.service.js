const ServerSettingsModel = require("../models/ServerSettings.js");
const Constants = require("../constants/server-settings.constants");
const { validateInput } = require("../handlers/validators");
const { serverSettingsUpdateRules } = require("./validators/server-settings-service.validation");
const { printerFileCleanSettingKey, getDefaultPrinterFileCleanSettings } = require("../constants/server-settings.constants");

class ServerSettingsService {
  async getOrCreate() {
    let settings = await ServerSettingsModel.findOne();
    if (!settings) {
      const defaultSystemSettings = new ServerSettingsModel(Constants.getDefaultSettings());
      await defaultSystemSettings.save();

      // Return to upper layer
      return defaultSystemSettings;
    } else {
      // Perform patch of settings
      settings = this.#migrateSettingsRuntime(settings);

      await ServerSettingsModel.updateOne({ _id: settings.id }, settings);
      return settings;
    }
  }

  /**
   * Patch the given settings object manually - runtime migration strategy
   * @param knownSettings
   * @returns {*}
   */
  #migrateSettingsRuntime(knownSettings) {
    const doc = knownSettings; // alias _doc also works
    if (!doc[printerFileCleanSettingKey]) {
      doc[printerFileCleanSettingKey] = getDefaultPrinterFileCleanSettings();
    }

    // Server settings exist, but need updating with new ones if they don't exists.
    if (!doc.timeout) {
      doc.timeout = Constants.getDefaultTimeout();
    }
    if (!doc.server) {
      doc.server = Constants.server;
    }
    if (!doc.history) {
      doc.history = Constants.history;
    }
    if (!doc?.influxExport) {
      doc.influxExport = Constants.influxExport;
    }

    return knownSettings;
  }

  async setRegistrationEnabled(enabled = true) {
    const settingsDoc = await this.getOrCreate();
    settingsDoc.server.registration = enabled;
    return await settingsDoc.save();
  }

  async update(patchUpdate) {
    const validatedInput = validateInput(patchUpdate, serverSettingsUpdateRules);
    const settingsDoc = await this.getOrCreate();

    return ServerSettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput);
  }
}

module.exports = ServerSettingsService;
