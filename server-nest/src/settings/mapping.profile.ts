import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import type { Mapper } from "@automapper/core";
import { createMap } from "@automapper/core";
import { Injectable } from "@nestjs/common";
import { SettingsDto } from "@/settings/dto/settings.dto";
import { Settings } from "@/settings/entities/settings.entity";
import { ServerSetting } from "@/settings/models/server-setting.model";
import { ServerSettingsDto } from "@/settings/dto/server.settings.dto";
import { FileCleanSettings } from "@/settings/models/file-clean.settings.model";
import { FileCleanSettingsDto } from "@/settings/dto/file-clean.settings.dto";
import { ClientSettingsDto } from "@/settings/dto/client-settings.dto";
import { ClientSettings } from "@/settings/models/client-setting.model";

@Injectable()
export class MappingProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(mapper, Settings, SettingsDto);
      createMap(mapper, ClientSettings, ClientSettingsDto);
      createMap(mapper, ServerSetting, ServerSettingsDto);
      createMap(mapper, FileCleanSettings, FileCleanSettingsDto);
    };
  }
}
