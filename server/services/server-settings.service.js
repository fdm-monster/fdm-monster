const ServerSettingsModel = require("../models/ServerSettings.js");
const Constants = require("../constants/server-settings.constants");
const { validateInput } = require("../handlers/validators");
const { serverSettingsUpdateRules } = require("./validators/server-settings-service.validation");

class ServerSettingsService {
  async getOrCreate() {
    const settings = await ServerSettingsModel.findOne();
    if (!settings) {
      const defaultSystemSettings = new ServerSettingsModel(Constants.getDefaultSettings());
      await defaultSystemSettings.save();

      // Return to upper layer
      return defaultSystemSettings;
    } else {
      // Server settings exist, but need updating with new ones if they don't exists.
      if (!settings.timeout) {
        settings.timeout = Constants.getDefaultTimeout();
      }
      if (!settings.server) {
        settings.server = Constants.server;
      }
      if (!settings.history) {
        settings.history = Constants.history;
      }
      if (!settings?.influxExport) {
        settings.influxExport = Constants.influxExport;
      }

      await settings.save();
      return settings;
    }
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
