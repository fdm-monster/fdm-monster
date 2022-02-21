const { InternalServerException } = require("../exceptions/runtime.exceptions");
const { printerFileCleanSettingKey } = require("../constants/server-settings.constants");

class SettingsStore {
  #serverSettings;
  #clientSettings;

  #clientSettingsService;
  #serverSettingsService;

  constructor({ clientSettingsService, serverSettingsService }) {
    this.#clientSettingsService = clientSettingsService;
    this.#serverSettingsService = serverSettingsService;
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.#serverSettings = await this.#serverSettingsService.getOrCreate();
    this.#clientSettings = await this.#clientSettingsService.getOrCreate();
  }

  isRegistrationEnabled() {
    if (!this.#serverSettings)
      throw new InternalServerException(
        "Could not check server settings (server settings not loaded"
      );
    return this.#serverSettings.server.registration;
  }

  getServerSettings() {
    return Object.freeze({
      ...this.#serverSettings._doc
    });
  }

  getClientSettings() {
    return Object.freeze({
      ...this.#clientSettings._doc
    });
  }

  /**
   * Cross-cutting concern for file clean operation
   * @returns {*}
   */
  getPrinterFileCleanSettings() {
    return this.getServerSettings()[printerFileCleanSettingKey];
  }

  async setRegistrationEnabled(enabled = true) {
    this.#serverSettings = await this.#serverSettingsService.setRegistrationEnabled(enabled);
  }

  async updateClientSettings(fullUpdate) {
    this.#clientSettings = await this.#clientSettingsService.update(fullUpdate);

    return this.getClientSettings();
  }

  async updateServerSettings(fullUpdate) {
    this.#serverSettings = await this.#serverSettingsService.update(fullUpdate);

    const cachedSettings = this.getServerSettings();
    return cachedSettings;
  }
}

module.exports = SettingsStore;
