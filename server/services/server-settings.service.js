import ServerSettingsModel from "../models/ServerSettings.js";
import Constants from "../constants/server-settings.constants.js";
import {validateInput} from "../handlers/validators.js";
import {serverSettingsUpdateRules} from "./validators/server-settings-service.validation.js";

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
        return ServerSettingsModel.findOneAndUpdate({_id: settingsDoc._id}, validatedInput);
    }
}

export default ServerSettingsService;
