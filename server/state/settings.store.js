const { InternalServerException } = require("../exceptions/runtime.exceptions");
const {
  printerFileCleanSettingKey,
  serverSettingKey,
} = require("../constants/server-settings.constants");

class SettingsStore {
  #serverSettings;
  #serverSettingsService;

  constructor({ serverSettingsService }) {
    this.#serverSettingsService = serverSettingsService;
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.#serverSettings = await this.#serverSettingsService.getOrCreate();
  }

  isRegistrationEnabled() {
    if (!this.#serverSettings)
      throw new InternalServerException(
        "Could not check server settings (server settings not loaded"
      );
    return this.#serverSettings[serverSettingKey].registration;
  }

  getServerSettings() {
    return Object.freeze({
      ...this.#serverSettings._doc,
    });
  }

  /**
   * Cross-cutting concern for file clean operation
   * @returns {*}
   */
  getPrinterFileCleanSettings() {
    return this.getServerSettings()[printerFileCleanSettingKey];
  }

  isPreUploadFileCleanEnabled() {
    return this.getServerSettings()[printerFileCleanSettingKey]?.autoRemoveOldFilesBeforeUpload;
  }

  async setRegistrationEnabled(enabled = true) {
    this.#serverSettings = await this.#serverSettingsService.setRegistrationEnabled(enabled);
    return this.getServerSettings();
  }

  async setLoginRequired(enabled = true) {
    this.#serverSettings = await this.#serverSettingsService.setLoginRequired(enabled);
    return this.getServerSettings();
  }

  async setWhitelist(enabled = true, ipAddresses) {
    this.#serverSettings = await this.#serverSettingsService.setWhitelist(enabled, ipAddresses);
    return this.getServerSettings();
  }

  async updateServerSettings(fullUpdate) {
    this.#serverSettings = await this.#serverSettingsService.update(fullUpdate);
    return this.getServerSettings();
  }
}

module.exports = SettingsStore;
