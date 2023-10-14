import { Settings } from "@/entities";
import {
  credentialSettingsKey,
  fileCleanSettingKey,
  frontendSettingKey,
  getDefaultCredentialSettings,
  getDefaultFileCleanSettings,
  getDefaultFrontendSettings,
  getDefaultServerSettings,
  getDefaultTimeout,
  getDefaultWizardSettings,
  serverSettingsKey,
  timeoutSettingKey,
  wizardSettingKey,
} from "@/constants/server-settings.constants";
import { BaseService } from "@/services/orm/base.service";
import {
  CredentialSettingsDto,
  FileCleanSettingsDto,
  FrontendSettingsDto,
  ServerSettingsDto,
  SettingsDto,
  TimeoutSettingsDto,
  WizardSettingsDto,
} from "../interfaces/settings.dto";
import { SqliteIdType } from "@/shared.constants";
import { ISettingsService } from "@/services/interfaces/settings.service.interface";
import { Error, Promise } from "mongoose";
import { ICredentialSettings, ITimeoutSettings } from "@/models/Settings";
import { NotImplementedException } from "@/exceptions/runtime.exceptions";

export class SettingsService2 extends BaseService(Settings, SettingsDto) implements ISettingsService<SqliteIdType, Settings> {
  toDto(entity: Settings): SettingsDto<SqliteIdType> {
    return {
      [serverSettingsKey]: entity[serverSettingsKey],
      [frontendSettingKey]: entity[frontendSettingKey],
      [fileCleanSettingKey]: entity[fileCleanSettingKey],
      [wizardSettingKey]: entity[wizardSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey],
    };
  }

  async getOrCreate() {
    const settings = await this.get();

    if (!settings) {
      const settings = this.create({
        [serverSettingsKey]: getDefaultServerSettings(),
        [credentialSettingsKey]: getDefaultCredentialSettings(),
        [wizardSettingKey]: getDefaultWizardSettings(),
        [fileCleanSettingKey]: getDefaultFileCleanSettings(),
        [frontendSettingKey]: getDefaultFrontendSettings(),
        [timeoutSettingKey]: getDefaultTimeout(),
      });
      return settings;
    }

    return settings;
  }

  async getServerSettings() {
    const settings = await this.getOrCreate();
    return settings[serverSettingsKey];
  }

  async patchServerSettings(serverSettingsPartial: ServerSettingsDto) {
    const entity = await this.getOrCreate();
    if (!entity[serverSettingsKey]) {
      throw new Error("No existing server settings found, cant patch");
    }

    const newServerSettings = {
      ...entity[serverSettingsKey],
      ...serverSettingsPartial,
    };

    return await this.updateServerSettings(newServerSettings);
  }

  async updateServerSettings(serverSettings: ServerSettingsDto) {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey] = serverSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateCredentialSettings(credentialSettings: CredentialSettingsDto) {
    const entity = await this.getOrCreate();
    entity[credentialSettingsKey] = credentialSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFileCleanSettings(fileCleanSettings: FileCleanSettingsDto) {
    const entity = await this.getOrCreate();
    entity[fileCleanSettingKey] = fileCleanSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateFrontendSettings(frontendSettings: FrontendSettingsDto) {
    const entity = await this.getOrCreate();
    entity[frontendSettingKey] = frontendSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async updateTimeoutSettings(timeoutSettings: TimeoutSettingsDto) {
    const entity = await this.getOrCreate();
    entity[timeoutSettingKey] = timeoutSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async patchWizardSettings(wizardSettingsPartial: WizardSettingsDto) {
    const entity = await this.getOrCreate();
    if (!entity[wizardSettingKey]) {
      throw new Error("No existing wizard settings found, cant patch");
    }

    const newWizardSettings = {
      ...entity[wizardSettingKey],
      ...wizardSettingsPartial,
    };

    return await this.updateWizardSettings(newWizardSettings);
  }

  async updateWizardSettings(wizardSettings: WizardSettingsDto) {
    const entity = await this.getOrCreate();
    entity[wizardSettingKey] = wizardSettings;
    await this.update(entity.id, entity);
    return entity;
  }

  async get() {
    const settingsList = await this.repository.find({ take: 1 });
    return settingsList?.length ? settingsList[0] : null;
  }

  migrateSettingsRuntime(knownSettings: Partial<Settings>): any {
    throw new NotImplementedException();
  }

  patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>): Promise<Settings> {
    throw new NotImplementedException();
  }

  patchFileCleanSettings(fileClean: Partial<FileCleanSettingsDto>): Promise<Settings> {
    throw new NotImplementedException();
  }

  setLoginRequired(enabled: boolean): Promise<Settings> {
    throw new NotImplementedException();
  }

  setRegistrationEnabled(enabled: boolean): Promise<Settings> {
    throw new NotImplementedException();
  }

  setSentryDiagnosticsEnabled(enabled: boolean): Promise<Settings> {
    throw new NotImplementedException();
  }

  setWhitelist(enabled: boolean, ipAddresses: string[]): Promise<Settings> {
    throw new NotImplementedException();
  }
}
