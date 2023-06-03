const { InternalServerException } = require("../exceptions/runtime.exceptions");
const { printerFileCleanSettingKey, serverSettingsKey } = require("../constants/server-settings.constants");

class SettingsStore {
  #settings;
  /**
   * @type {SettingsService}
   */
  settingsService;

  constructor({ settingsService }) {
    this.settingsService = settingsService;
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.#settings = await this.settingsService.getOrCreate();
  }

  isRegistrationEnabled() {
    if (!this.#settings) throw new InternalServerException("Could not check server settings (server settings not loaded");
    return this.#settings[serverSettingsKey].registration;
  }

  getSettings() {
    return Object.freeze({
      ...this.#settings._doc,
    });
  }

  getServerSettings() {
    return this.getSettings()[serverSettingsKey];
  }

  /**
   * Cross-cutting concern for file clean operation
   * @returns {*}
   */
  getPrinterFileCleanSettings() {
    return this.getSettings()[printerFileCleanSettingKey];
  }

  isPreUploadFileCleanEnabled() {
    return this.getSettings()[printerFileCleanSettingKey]?.autoRemoveOldFilesBeforeUpload;
  }

  async updateSettings(fullUpdate) {
    this.#settings = await this.settingsService.update(fullUpdate);
    return this.getSettings();
  }

  async setRegistrationEnabled(enabled = true) {
    this.#settings = await this.settingsService.setRegistrationEnabled(enabled);
    return this.getSettings();
  }

  async setLoginRequired(enabled = true) {
    this.#settings = await this.settingsService.setLoginRequired(enabled);
    return this.getSettings();
  }

  async setWhitelist(enabled = true, ipAddresses) {
    this.#settings = await this.settingsService.setWhitelist(enabled, ipAddresses);
    return this.getSettings();
  }

  async updateServerSettings(serverSettings) {
    this.#settings = await this.settingsService.updateServerSettings(serverSettings);
    return this.getSettings();
  }

  async updateFrontendSettings(frontendSettings) {
    this.#settings = await this.settingsService.updateFrontendSettings(frontendSettings);
    return this.getSettings();
  }
}

module.exports = SettingsStore;
