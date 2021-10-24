const ServerSettingsDB = require("../models/ServerSettings.js");
const Constants = require("../constants/server-settings.constants");

class ServerSettingsService {
  async getOrCreate() {
    const settings = await ServerSettingsDB.find({});
    if (settings.length < 1) {
      const defaultSystemSettings = new ServerSettingsDB(Constants.getDefaultSettings());
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

  async update(obj) {
    const checked = await ServerSettingsDB.find({});

    checked[0] = obj;
    checked[0].save();
  }
}

module.exports = ServerSettingsService;
