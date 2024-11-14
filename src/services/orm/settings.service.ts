import { Settings } from "@/entities";
import {
  credentialSettingsKey,
  printerFileCleanSettingKey,
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
import { ICredentialSettings } from "@/models/Settings";
import { IConfigService } from "@/services/core/config.service";
import { TypeormService } from "@/services/typeorm/typeorm.service";

export class SettingsService2 extends BaseService(Settings, SettingsDto) implements ISettingsService<SqliteIdType, Settings> {
  configService: IConfigService;

  constructor({ configService, typeormService }: { configService: IConfigService; typeormService: TypeormService }) {
    super({ typeormService });
    this.configService = configService;
  }

  toDto(entity: Settings): SettingsDto<SqliteIdType> {
    return {
      [serverSettingsKey]: {
        ...entity[serverSettingsKey],
        experimentalTypeormSupport: true,
      },
      [frontendSettingKey]: entity[frontendSettingKey],
      [printerFileCleanSettingKey]: entity[printerFileCleanSettingKey],
      [wizardSettingKey]: entity[wizardSettingKey],
      [timeoutSettingKey]: entity[timeoutSettingKey],
    };
  }

  async getOrCreate() {
    let settings = await this.get();

    if (!settings) {
      const settings = await this.create({
        [serverSettingsKey]: getDefaultServerSettings(),
        [credentialSettingsKey]: getDefaultCredentialSettings(),
        [wizardSettingKey]: getDefaultWizardSettings(),
        [printerFileCleanSettingKey]: getDefaultFileCleanSettings(),
        [frontendSettingKey]: getDefaultFrontendSettings(),
        [timeoutSettingKey]: getDefaultTimeout(),
      });
      return settings;
    } else {
      settings = this.migrateSettingsRuntime(settings);
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
    entity[printerFileCleanSettingKey] = fileCleanSettings;
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

  migrateSettingsRuntime(knownSettings: Settings): Settings {
    const entity = knownSettings; // alias _doc also works
    if (!entity[printerFileCleanSettingKey]) {
      entity[printerFileCleanSettingKey] = getDefaultFileCleanSettings();
    } else {
      // Remove superfluous settings
      entity[printerFileCleanSettingKey] = {
        autoRemoveOldFilesBeforeUpload: entity[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
        autoRemoveOldFilesAtBoot: entity[printerFileCleanSettingKey].autoRemoveOldFilesBeforeUpload,
        autoRemoveOldFilesCriteriumDays: entity[printerFileCleanSettingKey].autoRemoveOldFilesCriteriumDays,
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
        debugSettings: entity[serverSettingsKey].debugSettings,
        loginRequired: entity[serverSettingsKey].loginRequired,
        registration: entity[serverSettingsKey].registration,
        experimentalClientSupport: entity[serverSettingsKey].experimentalClientSupport,
        experimentalMoonrakerSupport: entity[serverSettingsKey].experimentalMoonrakerSupport,
        sentryDiagnosticsEnabled: entity[serverSettingsKey].sentryDiagnosticsEnabled,
      };
    }
    if (!entity[credentialSettingsKey]) {
      entity[credentialSettingsKey] = getDefaultCredentialSettings();
    }
    if (!entity[frontendSettingKey]) {
      entity[frontendSettingKey] = getDefaultFrontendSettings();
    }

    return entity;
  }

  async patchCredentialSettings(patchUpdate: Partial<ICredentialSettings>): Promise<Settings> {
    const entity = await this.getOrCreate();
    if (!entity[credentialSettingsKey]) {
      throw new Error("No existing wizard settings found, cant patch");
    }

    const newCredentialSettings = {
      ...entity[credentialSettingsKey],
      ...patchUpdate,
    };

    return await this.updateCredentialSettings(newCredentialSettings);
  }

  async patchFileCleanSettings(patchUpdate: Partial<FileCleanSettingsDto>): Promise<Settings> {
    const entity = await this.getOrCreate();
    if (!entity[printerFileCleanSettingKey]) {
      throw new Error("No existing wizard settings found, cant patch");
    }

    const newFileCleanSettings = {
      ...entity[printerFileCleanSettingKey],
      ...patchUpdate,
    };

    return await this.updateFileCleanSettings(newFileCleanSettings);
  }

  async setLoginRequired(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].loginRequired = enabled;
    await this.update(entity.id, entity);
    return entity;
  }

  async setRegistrationEnabled(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].registration = enabled;
    await this.update(entity.id, entity);
    return entity;
  }

  async setSentryDiagnosticsEnabled(enabled: boolean): Promise<Settings> {
    const entity = await this.getOrCreate();
    entity[serverSettingsKey].sentryDiagnosticsEnabled = enabled;
    await this.update(entity.id, entity);
    return entity;
  }
}
