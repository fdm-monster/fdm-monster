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

  getServerSettings() {
    return Object.freeze({
      ...this.#serverSettings._doc
    });
  }

  async setFilamentManagerPluginEnabled(enabled) {
    this.#serverSettings = await this.#serverSettingsService.setFilamentManagerPluginSetting(
      enabled
    );
  }

  getClientSettings() {
    return Object.freeze({
      ...this.#clientSettings._doc
    });
  }

  isFilamentEnabled() {
    return this.#serverSettings.filamentManager;
  }

  getHistorySetting() {
    return this.#serverSettings.history;
  }
}

module.exports = SettingsStore;
