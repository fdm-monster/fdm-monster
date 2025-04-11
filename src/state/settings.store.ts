import { InternalServerException } from "@/exceptions/runtime.exceptions";
import {
  credentialSettingsKey,
  frontendSettingKey,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { getClient } from "@sentry/node";
import { isTestEnvironment } from "@/utils/env.utils";
import { AppConstants } from "@/server.constants";
import { LoggerService } from "@/handlers/logger";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { ISettings } from "@/models/Settings";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { z } from "zod";
import {
  credentialSettingUpdateSchema,
  fileCleanSettingsUpdateSchema,
  frontendSettingsUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
} from "@/services/validators/settings-service.validation";
import { IdType } from "@/shared.constants";

export class SettingsStore {
  private readonly logger: LoggerService;

  private settings: ISettings<IdType> | null = null;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly settingsService: ISettingsService,
    private readonly isTypeormMode: boolean,
  ) {
    this.logger = loggerFactory(SettingsStore.name);
  }

  getSettings() {
    this.throwIfSettingsUnset();

    const settings = this.settings!;

    return Object.freeze({
      // Credential settings are not shared with the client
      [serverSettingsKey]: {
        loginRequired: settings[serverSettingsKey].loginRequired,
        registration: settings[serverSettingsKey].registration,
        sentryDiagnosticsEnabled: settings[serverSettingsKey].sentryDiagnosticsEnabled,
        experimentalMoonrakerSupport: settings[serverSettingsKey].experimentalMoonrakerSupport,
        experimentalTypeormSupport: this.isTypeormMode,
        experimentalClientSupport: settings[serverSettingsKey].experimentalClientSupport,
        experimentalThumbnailSupport: settings[serverSettingsKey].experimentalThumbnailSupport,
      },
      [wizardSettingKey]: settings[wizardSettingKey],
      [frontendSettingKey]: settings[frontendSettingKey],
      [printerFileCleanSettingKey]: settings[printerFileCleanSettingKey],
      [timeoutSettingKey]: settings[timeoutSettingKey],
    });
  }

  getSettingsSensitive() {
    this.throwIfSettingsUnset();

    const settings = this.settings!;
    return Object.freeze({
      [credentialSettingsKey]: {
        jwtExpiresIn: settings[credentialSettingsKey].jwtExpiresIn,
        refreshTokenAttempts: settings[credentialSettingsKey].refreshTokenAttempts,
        refreshTokenExpiry: settings[credentialSettingsKey].refreshTokenExpiry,
      },
      [serverSettingsKey]: {
        experimentalMoonrakerSupport: settings[serverSettingsKey].experimentalMoonrakerSupport,
        experimentalTypeormSupport: this.isTypeormMode,
        experimentalClientSupport: settings[serverSettingsKey].experimentalClientSupport,
        experimentalThumbnailSupport: settings[serverSettingsKey].experimentalThumbnailSupport,
      },
    });
  }

  async loadSettings() {
    // Setup Settings and add established connection info
    this.settings = await this.settingsService.getOrCreate();
    await this.processSentryEnabled();
  }

  async getCredentialSettings() {
    this.throwIfSettingsUnset();

    return this.settings![credentialSettingsKey];
  }

  async getAnonymousDiagnosticsEnabled() {
    this.throwIfSettingsUnset();

    return this.settings![serverSettingsKey].sentryDiagnosticsEnabled;
  }

  async persistOptionalCredentialSettings(overrideJwtSecret?: string, overrideJwtExpiresIn?: string) {
    this.throwIfSettingsUnset();

    const credentialSettings = await this.getCredentialSettings();
    if (overrideJwtSecret?.length) {
      await this.settingsService.updateJwtSecretCredentialSetting({
        jwtSecret: overrideJwtSecret,
      });
    }

    if (overrideJwtExpiresIn?.length) {
      await this.updateCredentialSettings({
        refreshTokenExpiry: credentialSettings.refreshTokenExpiry,
        refreshTokenAttempts: credentialSettings.refreshTokenAttempts,
        jwtExpiresIn: parseInt(overrideJwtExpiresIn),
      });
    }

    this.settings![credentialSettingsKey] = await this.getCredentialSettings();
  }

  getWizardState() {
    this.throwIfSettingsUnset();

    const settings = this.settings!;
    return {
      wizardCompleted: settings[wizardSettingKey].wizardCompleted,
      wizardVersion: settings[wizardSettingKey].wizardVersion,
      latestWizardVersion: AppConstants.currentWizardVersion,
    };
  }

  isWizardCompleted() {
    this.throwIfSettingsUnset();

    const settings = this.settings!;
    return (
      settings[wizardSettingKey].wizardCompleted &&
      settings[wizardSettingKey].wizardVersion === AppConstants.currentWizardVersion
    );
  }

  getWizardSettings() {
    this.throwIfSettingsUnset();

    return this.settings![wizardSettingKey];
  }

  isRegistrationEnabled() {
    this.throwIfSettingsUnset();

    return this.settings![serverSettingsKey].registration;
  }

  isThumbnailSupportEnabled() {
    this.throwIfSettingsUnset();

    return this.settings![serverSettingsKey].experimentalThumbnailSupport;
  }

  getServerSettings() {
    return this.getSettings()[serverSettingsKey];
  }

  getTimeoutSettings() {
    return this.getSettings()[timeoutSettingKey];
  }

  getFrontendSettings() {
    return this.getSettings()[frontendSettingKey];
  }

  getFileCleanSettings() {
    return this.getSettings()[printerFileCleanSettingKey];
  }

  isPreUploadFileCleanEnabled() {
    return this.getSettings()[printerFileCleanSettingKey]?.autoRemoveOldFilesBeforeUpload;
  }

  async setWizardCompleted(version: number) {
    this.settings = await this.settingsService.updateWizardSettings({
      wizardCompleted: true,
      wizardCompletedAt: new Date(),
      wizardVersion: version,
    });
    return this.getSettings();
  }

  async getLoginRequired() {
    return this.getServerSettings().loginRequired;
  }

  async setLoginRequired(loginRequired = true) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].loginRequired = loginRequired;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async setRegistrationEnabled(registration = true) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].registration = registration;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async updateServerSettings(serverSettings: z.infer<typeof serverSettingsUpdateSchema>) {
    this.settings = await this.settingsService.updateServerSettings(serverSettings);
    return this.getSettings();
  }

  async updateTimeoutSettings(timeoutSettings: z.infer<typeof timeoutSettingsUpdateSchema>) {
    this.settings = await this.settingsService.updateTimeoutSettings(timeoutSettings);
    return this.getSettings();
  }

  async updateFileCleanSettings(fileClean: z.infer<typeof fileCleanSettingsUpdateSchema>) {
    this.settings = await this.settingsService.updateFileCleanSettings(fileClean);
    return this.getSettings();
  }

  async updateCredentialSettings(credentialSettings: z.infer<typeof credentialSettingUpdateSchema>) {
    this.settings = await this.settingsService.updateCredentialSettings(credentialSettings);
  }

  async setRefreshTokenSettings({
    refreshTokenAttempts,
    refreshTokenExpiry,
  }: {
    refreshTokenAttempts: number;
    refreshTokenExpiry: number;
  }) {
    this.throwIfSettingsUnset();
    this.settings![credentialSettingsKey].refreshTokenAttempts = refreshTokenAttempts;
    this.settings![credentialSettingsKey].refreshTokenExpiry = refreshTokenExpiry;
    await this.updateCredentialSettings(this.settings![credentialSettingsKey]);
  }

  async setSentryDiagnosticsEnabled(sentryDiagnosticsEnabled: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].sentryDiagnosticsEnabled = sentryDiagnosticsEnabled;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    await this.processSentryEnabled();
    return this.getSettings();
  }

  async setExperimentalMoonrakerSupport(experimentalMoonrakerSupport: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].experimentalMoonrakerSupport = experimentalMoonrakerSupport;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async setExperimentalThumbnailSupport(experimentalThumbnailSupport: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].experimentalThumbnailSupport = experimentalThumbnailSupport;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async setExperimentalClientSupport(experimentalClientSupport: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].experimentalClientSupport = experimentalClientSupport;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async updateFrontendSettings(frontendSettings: z.infer<typeof frontendSettingsUpdateSchema>) {
    this.settings = await this.settingsService.updateFrontendSettings(frontendSettings);
    return this.getSettings();
  }

  private throwIfSettingsUnset() {
    if (!this.settings)
      throw new InternalServerException("Could not check server settings (server settings not loaded)");
  }

  private async processSentryEnabled() {
    const sentryEnabled = await this.getAnonymousDiagnosticsEnabled();
    if (sentryEnabled) {
      this.logger.log("Enabling Sentry for remote diagnostics");
    } else {
      this.logger.log("Disabling Sentry for remote diagnostics");
    }

    if (isTestEnvironment()) return;
    const client = getClient();
    if (!client) {
      this.logger.warn("Could not apply Sentry. Was the SDK initialized?");
      return;
    }
    client.getOptions().enabled = sentryEnabled;
  }
}
