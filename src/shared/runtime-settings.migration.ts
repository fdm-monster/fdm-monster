import { IdType } from "@/shared.constants";
import { ISettings } from "@/models/Settings";
import {
  credentialSettingsKey,
  frontendSettingKey,
  getDefaultCredentialSettings,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultTimeout,
  getDefaultWizardSettings,
  printerFileCleanSettingKey,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey
} from "@/constants/server-settings.constants";
import { v4 as uuidv4 } from "uuid";

export function migrateSettingsRuntime<KeyType = IdType>(knownSettings: Partial<ISettings<KeyType>>): ISettings<KeyType> {
  const entity = knownSettings;
  if (!entity[printerFileCleanSettingKey]) {
    entity[printerFileCleanSettingKey] = getDefaultFileCleanSettings();
  } else {
    // Remove superfluous settings
    entity[printerFileCleanSettingKey] = {
      autoRemoveOldFilesBeforeUpload: entity[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
      autoRemoveOldFilesAtBoot: entity[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
      autoRemoveOldFilesCriteriumDays: entity[printerFileCleanSettingKey].autoRemoveOldFilesCriteriumDays
    };
  }

  // Server settings exist, but need updating with new ones if they don't exist.
  if (!entity[wizardSettingKey]) {
    entity[wizardSettingKey] = getDefaultWizardSettings();
  }
  if (!entity[timeoutSettingKey]) {
    entity[timeoutSettingKey] = getDefaultTimeout();
  }
  if (!entity[serverSettingsKey]) {
    entity[serverSettingsKey] = getDefaultServerSettings();
  } else {
    // Remove superfluous settings
    entity[serverSettingsKey] = {
      loginRequired: entity[serverSettingsKey].loginRequired,
      registration: entity[serverSettingsKey].registration,
      experimentalClientSupport: entity[serverSettingsKey].experimentalClientSupport,
      experimentalMoonrakerSupport: entity[serverSettingsKey].experimentalMoonrakerSupport,
      sentryDiagnosticsEnabled: entity[serverSettingsKey].sentryDiagnosticsEnabled,
      experimentalThumbnailSupport: entity[serverSettingsKey].experimentalThumbnailSupport
    };
  }
  if (!entity[credentialSettingsKey]) {
    entity[credentialSettingsKey] = {
      ...getDefaultCredentialSettings(),
      // Verification and signing of JWT tokens, can be changed on the fly
      jwtSecret: uuidv4()
    };
  }
  if (!entity[frontendSettingKey]) {
    entity[frontendSettingKey] = getDefaultFrontendSettings();
  }

  return entity as ISettings<KeyType>;
}
