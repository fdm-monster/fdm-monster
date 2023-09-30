import { ICredentialSettings, IFrontendSettings, IServerSettings, ISettings, IWizardSettings } from "@/models/Settings";

export interface ISettingsService {
  getOrCreate(): Promise<ISettings>;

  migrateSettingsRuntime(knownSettings: Partial<ISettings>): any;

  setSentryDiagnosticsEnabled(enabled: boolean): Promise<ISettings>;

  patchWizardSettings(patch: Partial<IWizardSettings>): Promise<ISettings>;

  setRegistrationEnabled(enabled: boolean): Promise<ISettings>;

  setLoginRequired(enabled: boolean): Promise<ISettings>;

  setWhitelist(enabled: boolean, ipAddresses: string[]): Promise<ISettings>;

  updateFrontendSettings(patchUpdate: IFrontendSettings): Promise<ISettings>;

  patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>): Promise<ISettings>;

  patchServerSettings(patchUpdate: Partial<IServerSettings>): Promise<ISettings>;
}
