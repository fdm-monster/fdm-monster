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
      const primarySettings = settings[0];

      // Server settings exist, but need updating with new ones if they don't exists.
      if (!primarySettings.timeout) {
        primarySettings.timeout = Constants.getDefaultTimeout();
      }
      if (!primarySettings.server) {
        primarySettings.server = Constants.server;
      }
      if (!primarySettings.history) {
        primarySettings.history = Constants.history;
      }
      if (!primarySettings?.influxExport) {
        primarySettings.influxExport = Constants.influxExport;
      }

      await primarySettings.save();
      return primarySettings;
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
