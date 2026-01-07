import { InternalServerException } from "@/exceptions/runtime.exceptions";
import {
  credentialSettingsKey,
  frontendSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { getClient } from "@sentry/node";
import { isTestEnvironment } from "@/utils/env.utils";
import { AppConstants } from "@/server.constants";
import { LoggerService } from "@/handlers/logger";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { z } from "zod";
import {
  credentialCoreSettingUpdateSchema,
  frontendSettingsUpdateSchema,
  serverSettingsUpdateSchema,
  timeoutSettingsUpdateSchema,
} from "@/services/validators/settings-service.validation";
import { Settings } from "@/entities";
import { v4 as uuidv4 } from "uuid";

export class SettingsStore {
  private readonly logger: LoggerService;

  private settings: Settings | null = null;

  constructor(
    loggerFactory: ILoggerFactory,
    private readonly settingsService: ISettingsService,
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
        experimentalPrusaLinkSupport: settings[serverSettingsKey].experimentalPrusaLinkSupport,
        experimentalBambuSupport: settings[serverSettingsKey].experimentalBambuSupport
      },
      [wizardSettingKey]: settings[wizardSettingKey],
      [frontendSettingKey]: settings[frontendSettingKey],
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
        slicerApiKey: settings[credentialSettingsKey].slicerApiKey
      },
      [serverSettingsKey]: {
        loginRequired: settings[serverSettingsKey].loginRequired,
        registration: settings[serverSettingsKey].registration,
        sentryDiagnosticsEnabled: settings[serverSettingsKey].sentryDiagnosticsEnabled,
        experimentalMoonrakerSupport: settings[serverSettingsKey].experimentalMoonrakerSupport,
        experimentalPrusaLinkSupport: settings[serverSettingsKey].experimentalPrusaLinkSupport,
        experimentalBambuSupport: settings[serverSettingsKey].experimentalBambuSupport
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
      await this.updateCoreCredentialSettings({
        refreshTokenExpiry: credentialSettings.refreshTokenExpiry,
        refreshTokenAttempts: credentialSettings.refreshTokenAttempts,
        jwtExpiresIn: Number.parseInt(overrideJwtExpiresIn),
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

  getServerSettings() {
    return this.getSettings()[serverSettingsKey];
  }

  getTimeoutSettings() {
    return this.getSettings()[timeoutSettingKey];
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

  async updateCoreCredentialSettings(credentialSettings: z.infer<typeof credentialCoreSettingUpdateSchema>) {
    this.settings = await this.settingsService.updateCoreCredentialSettings(credentialSettings);
  }

  async setRefreshTokenSettings({ refreshTokenAttempts, refreshTokenExpiry, }:
                                { refreshTokenAttempts: number; refreshTokenExpiry: number; }) {
    this.throwIfSettingsUnset();
    this.settings![credentialSettingsKey].refreshTokenAttempts = refreshTokenAttempts;
    this.settings![credentialSettingsKey].refreshTokenExpiry = refreshTokenExpiry;
    await this.updateCoreCredentialSettings(this.settings![credentialSettingsKey]);
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

  async setExperimentalPrusaLinkSupport(experimentalPrusaLinkSupport: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].experimentalPrusaLinkSupport = experimentalPrusaLinkSupport;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);

    return this.getSettings();
  }

  async setExperimentalBambuSupport(experimentalBambuSupport: boolean) {
    this.throwIfSettingsUnset();
    this.settings![serverSettingsKey].experimentalBambuSupport = experimentalBambuSupport;
    this.settings = await this.settingsService.updateServerSettings(this.settings![serverSettingsKey]);
    return this.getSettings();
  }

  async updateFrontendSettings(frontendSettings: z.infer<typeof frontendSettingsUpdateSchema>) {
    this.settings = await this.settingsService.updateFrontendSettings(frontendSettings);
    return this.getSettings();
  }

  getSlicerApiKey() {
    this.throwIfSettingsUnset();
    return this.settings![credentialSettingsKey].slicerApiKey;
  }

  async generateSlicerApiKey() {
    const newApiKey = uuidv4();
    return this.setSlicerApiKey(newApiKey);
  }

  async setSlicerApiKey(apiKey: string) {
    this.throwIfSettingsUnset();
    this.settings = await this.settingsService.updateSlicerApiKey({ slicerApiKey: apiKey });
    return apiKey;
  }

  async deleteSlicerApiKey() {
    this.throwIfSettingsUnset();
    this.settings = await this.settingsService.updateSlicerApiKey({ slicerApiKey: null });
  }

  validateSlicerApiKey(apiKey: string): boolean {
    const storedKey = this.getSlicerApiKey();
    if (!storedKey) {
      return false;
    }
    return storedKey === apiKey;
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
