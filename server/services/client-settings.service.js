const ClientSettingsModel = require("../models/ClientSettings.js");
const Constants = require("../constants/client-settings.constants");
const { validateInput } = require("../handlers/validators");
const { clientSettingsUpdateRules } = require("./validators/client-settings-service.validation");

class ClientSettingsService {
  async getOrCreate() {
    const settings = await ClientSettingsModel.findOne();

    if (!settings) {
      const defaultClientSettings = new ClientSettingsModel(Constants.getDefaultClientSettings());
      await defaultClientSettings.save();
      return defaultClientSettings;
    }

    return settings;
  }

  async update(patchUpdate) {
    const validatedInput = await validateInput(patchUpdate, clientSettingsUpdateRules);
    const settingsDoc = await this.getOrCreate();

    return ClientSettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput, { new: true });
  }
}

module.exports = ClientSettingsService;
