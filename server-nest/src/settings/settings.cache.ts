import { Injectable, Logger } from "@nestjs/common";
import { CacheCrudManager } from "@/shared/cached-crud.manager";
import { Settings } from "@/settings/entities/settings.entity";
import { CreateSettingsDto } from "@/settings/dto/create-settings.dto";
import { SettingsDto } from "@/settings/dto/settings.dto";
import {
  clientSettingsKey,
  fileCleanSettingsKey,
  getDefaultClientSettings,
  getDefaultFileCleanSettings,
  getDefaultServerSettings,
  getDefaultSettings,
  serverSettingsKey,
} from "@/settings/settings.constants";
import { SettingsService } from "@/settings/settings.service";
import { DeepPartial } from "typeorm";
import { UpdateFileCleanSettingsDto } from "@/settings/dto/update-file-clean.settings.dto";
import { UpdateClientSettingsDto } from "@/settings/dto/update-client.settings.dto";

@Injectable()
export class SettingsCache extends CacheCrudManager<Settings, {}, CreateSettingsDto, DeepPartial<CreateSettingsDto>, SettingsDto>(
  "settings",
  SettingsService,
  Settings,
  SettingsDto,
  0
) {
  private readonly logger = new Logger(SettingsCache.name);
  private readonly settingsId = 1;

  async getOrCreate() {
    let settings = await this.get(this.settingsId, false);
    if (!settings) {
      this.logger.log("Created ServerSettings by default as it was not provided");
      settings = await this.create(getDefaultSettings());
    }

    return settings;
  }

  async isLoginRequired() {
    const settings = await this.getOrCreate();
    return settings.server.requireLogin;
  }

  async patchSettings() {
    const settings = await this.getOrCreate();
    if (!settings[fileCleanSettingsKey]) {
      settings[fileCleanSettingsKey] = getDefaultFileCleanSettings();
    }
    if (!settings[serverSettingsKey]) {
      settings[serverSettingsKey] = getDefaultServerSettings();
    }
    if (!settings[clientSettingsKey]) {
      this.logger.debug("Patching client settings");
      settings[clientSettingsKey] = getDefaultClientSettings();
    }
    return await this.update(this.settingsId, settings);
  }

  async updateIsLoginRequired(requireLogin: boolean) {
    const serverSettings = await this.getOrCreate();
    serverSettings.server.requireLogin = requireLogin;
    return await this.update(this.settingsId, serverSettings);
  }

  async updateFileCleanSettings(updateFileCleanSettings: UpdateFileCleanSettingsDto) {
    const settings = await this.getOrCreate();
    settings.fileClean = updateFileCleanSettings;
    return this.update(this.settingsId, settings);
  }

  async updateClientSettings(updateClientSettings: UpdateClientSettingsDto) {
    const settings = await this.getOrCreate();
    settings.client = updateClientSettings;
    return this.update(this.settingsId, settings);
  }
}
