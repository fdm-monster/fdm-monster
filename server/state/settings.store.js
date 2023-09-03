const { InternalServerException } = require("../exceptions/runtime.exceptions");
const {
  wizardSettingKey,
  fileCleanSettingKey,
  serverSettingsKey,
  credentialSettingsKey,
  frontendSettingKey,
  timeoutSettingKey,
} = require("../constants/server-settings.constants");
const Sentry = require("@sentry/node");
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
    this.logger = loggerFactory(SettingsStore.name);
  }

  getSettings() {
    const settings = this.settings._doc;
    return Object.freeze({
      [wizardSettingKey]: settings[wizardSettingKey],
      [frontendSettingKey]: settings[frontendSettingKey],
      [serverSettingsKey]: settings[serverSettingsKey],
      [fileCleanSettingKey]: settings[fileCleanSettingKey],
      [timeoutSettingKey]: settings[timeoutSettingKey],
    });
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.settings = await this.settingsService.getOrCreate();
    await this.processSentryEnabled();
  }

  async getCredentialSettings() {
    return this.settings[credentialSettingsKey];
  }

  async getAnonymousDiagnosticsEnabled() {
    return this.settings[serverSettingsKey].sentryDiagnosticsEnabled;
  }

  async persistOptionalCredentialSettings(overrideJwtSecret, overrideJwtExpiresIn) {
    if (overrideJwtSecret) {
      await this.updateCredentialSettings({
        jwtSecret: overrideJwtSecret,
      });
    }
    if (overrideJwtExpiresIn) {
      await this.updateCredentialSettings({
        jwtExpiresIn: overrideJwtExpiresIn,
      });
    }
  }

  isWizardCompleted() {
    return this.settings[wizardSettingKey].wizardCompleted;
  }

  getWizardSettings() {
    return this.settings[wizardSettingKey];
  }

  isRegistrationEnabled() {
    if (!this.settings) throw new InternalServerException("Could not check server settings (server settings not loaded");
    return this.settings[serverSettingsKey].registration;
  }

  getServerSettings() {
    return this.getSettings()[serverSettingsKey];
  }

  /**
   * Cross-cutting concern for file clean operation
   * @returns {*}
   */
  getFileCleanSettings() {
    return this.getSettings()[fileCleanSettingKey];
  }

  isPreUploadFileCleanEnabled() {
    return this.getSettings()[fileCleanSettingKey]?.autoRemoveOldFilesBeforeUpload;
  }

  async setWizardCompleted() {
    this.settings = await this.settingsService.setWizardCompleted();
    return this.getSettings();
  }

  async setRegistrationEnabled(enabled = true) {
    this.settings = await this.settingsService.setRegistrationEnabled(enabled);
    return this.getSettings();
  }

  async getLoginRequired() {
    return this.getServerSettings().loginRequired;
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

  async updateCredentialSettings(credentialSettings) {
    this.settings = await this.settingsService.updateCredentialSettings(credentialSettings);
    return this.getSettings();
  }

  async setSentryDiagnosticsEnabled(enabled) {
    this.settings = await this.settingsService.setSentryDiagnosticsEnabled(enabled);
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
      this.logger.log("Enabling Sentry for remote diagnostics");
    } else {
      this.logger.log("Disabling Sentry for remote diagnostics");
    }
    Sentry.getCurrentHub().getClient().getOptions().enabled = sentryEnabled;
  }

  async updateFrontendSettings(frontendSettings) {
    this.settings = await this.settingsService.updateFrontendSettings(frontendSettings);
    return this.getSettings();
  }
}

module.exports = SettingsStore;
