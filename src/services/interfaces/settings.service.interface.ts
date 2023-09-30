import { ISettings } from "@/models/Settings";

export interface ISettingsService {
  getOrCreate(): Promise<ISettings>;

  migrateSettingsRuntime(knownSettings): any;

  setSentryDiagnosticsEnabled(enabled: boolean): Promise<ISettings>;

  setWizardCompleted(version: number): Promise<ISettings>;

  setRegistrationEnabled(enabled: boolean): Promise<ISettings>;

  setLoginRequired(enabled: boolean): Promise<ISettings>;

  setWhitelist(enabled: boolean, ipAddresses: string[]): Promise<ISettings>;

  updateFrontendSettings(patchUpdate): Promise<ISettings>;

  updateCredentialSettings(patchUpdate): Promise<ISettings>;

  updateServerSettings(patchUpdate): Promise<ISettings>;
}
