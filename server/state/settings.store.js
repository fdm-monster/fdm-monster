const { InternalServerException } = require("../exceptions/runtime.exceptions");
const { printerFileCleanSettingKey, serverSettingsKey } = require("../constants/server-settings.constants");
const Sentry = require("@sentry/node");
const SettingsModel = require("../models/ServerSettings");
const { isTestEnvironment } = require("../utils/env.utils");

class SettingsStore {
  /**
   * @private
   * @type {ServerSettings}
   */
  settings;
  /**
   * @type {SettingsService}
   */
  settingsService;
  /**
   * @type {LoggerService}
   */
  logger;

  constructor({ settingsService, loggerFactory }) {
    this.settingsService = settingsService;
    this.logger = loggerFactory("SettingsStore");
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.settings = await this.settingsService.getOrCreate();
    await this.processSentryEnabled();
  }

  async getAnonymousDiagnosticsEnabled() {
    return this.settings.server.anonymousDiagnosticsEnabled;
  }

  isRegistrationEnabled() {
    if (!this.settings) throw new InternalServerException("Could not check server settings (server settings not loaded");
    return this.settings[serverSettingsKey].registration;
  }

  getSettings() {
    return Object.freeze({
      ...this.settings._doc,
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
    this.settings = await this.settingsService.update(fullUpdate);
    return this.getSettings();
  }

  async setRegistrationEnabled(enabled = true) {
    this.settings = await this.settingsService.setRegistrationEnabled(enabled);
    return this.getSettings();
  }

  async setLoginRequired(enabled = true) {
    this.settings = await this.settingsService.setLoginRequired(enabled);
    return this.getSettings();
  }

  async setWhitelist(enabled = true, ipAddresses) {
    this.settings = await this.settingsService.setWhitelist(enabled, ipAddresses);
    return this.getSettings();
  }

  async updateServerSettings(serverSettings) {
    this.settings = await this.settingsService.updateServerSettings(serverSettings);
    return this.getSettings();
  }

  async setAnonymousDiagnosticsEnabled(enabled) {
    this.settings = await this.settingsService.setAnonymousDiagnosticsEnabled(enabled);
    await this.processSentryEnabled();
    return this.getSettings();
  }

  /**
   * @private
   * @returns {Promise<void>}
   */
  async processSentryEnabled() {
    if (isTestEnvironment()) return;
    const sentryEnabled = await this.getAnonymousDiagnosticsEnabled();
    if (sentryEnabled) {
      this.logger.log("Enabling Sentry for anonymous diagnostics");
    }
    Sentry.getCurrentHub().getClient().getOptions().enabled = sentryEnabled;
  }

  async updateFrontendSettings(frontendSettings) {
    this.settings = await this.settingsService.updateFrontendSettings(frontendSettings);
    return this.getSettings();
  }
}

module.exports = SettingsStore;
