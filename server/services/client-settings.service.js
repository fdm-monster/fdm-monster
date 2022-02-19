import ClientSettingsModel from "../models/ClientSettings.js";
import Constants from "../constants/client-settings.constants.js";
import { validateInput } from "../handlers/validators.js";
import { clientSettingsUpdateRules } from "./validators/client-settings-service.validation.js";

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
        return ClientSettingsModel.findOneAndUpdate({ _id: settingsDoc._id }, validatedInput);
    }
}
export default ClientSettingsService;
