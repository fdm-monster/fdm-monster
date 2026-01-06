import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultCredentialSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultTimeout,
  getDefaultWizardSettings,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { v4 as uuidv4 } from "uuid";
import { Settings } from "@/entities";

export function migrateSettingsRuntime(knownSettings: Partial<Settings>): Settings {
  const entity = knownSettings;

  entity[wizardSettingKey] ??= getDefaultWizardSettings();
  entity[timeoutSettingKey] ??= getDefaultTimeout();

  if (entity[timeoutSettingKey]) {
    const defaultTimeoutSettings = getDefaultTimeout();
    entity[timeoutSettingKey] = {
      apiTimeout: entity[timeoutSettingKey].apiTimeout ?? defaultTimeoutSettings.apiTimeout,
      apiUploadTimeout: entity[timeoutSettingKey].apiUploadTimeout ?? defaultTimeoutSettings.apiUploadTimeout,
    };
  }

  entity[serverSettingsKey] ??= getDefaultServerSettings();
  entity[frontendSettingKey] ??= getDefaultFrontendSettings();
  entity[credentialSettingsKey] ??= {
    ...getDefaultCredentialSettings(),
    // Verification and signing of JWT tokens, can be changed on the fly
    jwtSecret: uuidv4(),
  };

  if (entity[frontendSettingKey]) {
    const defaultFrontendSettings = getDefaultFrontendSettings();

    // Ensure all frontend settings have default values
    entity[frontendSettingKey] = {
      gridCols: entity[frontendSettingKey].gridCols ?? defaultFrontendSettings.gridCols,
      gridRows: entity[frontendSettingKey].gridRows ?? defaultFrontendSettings.gridRows,
      largeTiles: entity[frontendSettingKey].largeTiles ?? defaultFrontendSettings.largeTiles,
      tilePreferCancelOverQuickStop: entity[frontendSettingKey].tilePreferCancelOverQuickStop ?? defaultFrontendSettings.tilePreferCancelOverQuickStop,
      gridNameSortDirection: entity[frontendSettingKey].gridNameSortDirection ?? defaultFrontendSettings.gridNameSortDirection,
    };
  }

  if (entity[serverSettingsKey]) {
    const defaultServerSettings = getDefaultServerSettings();

    // Remove superfluous settings and provide default values if properties are missing
    entity[serverSettingsKey] = {
      loginRequired: entity[serverSettingsKey].loginRequired ?? defaultServerSettings.loginRequired,
      registration: entity[serverSettingsKey].registration ?? defaultServerSettings.registration,
      experimentalMoonrakerSupport:
        entity[serverSettingsKey].experimentalMoonrakerSupport ?? defaultServerSettings.experimentalMoonrakerSupport,
      experimentalPrusaLinkSupport:
        entity[serverSettingsKey].experimentalPrusaLinkSupport ?? defaultServerSettings.experimentalPrusaLinkSupport,
      experimentalBambuSupport:
        entity[serverSettingsKey].experimentalBambuSupport ?? defaultServerSettings.experimentalBambuSupport,
      sentryDiagnosticsEnabled:
        entity[serverSettingsKey].sentryDiagnosticsEnabled ?? defaultServerSettings.sentryDiagnosticsEnabled
    };
  }

  return entity as Settings;
}
