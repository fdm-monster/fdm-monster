const { InternalServerException } = require("../exceptions/runtime.exceptions");

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

  isUserRegistrationEnabled() {
    if (!this.#serverSettings) throw new InternalServerException("Could not check server settings (server settings not loaded");
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

  getHistorySetting() {
    return this.#serverSettings.history;
  }
}

module.exports = SettingsStore;
