import { ServerSettingsDto } from "@/settings/dto/server.settings.dto";
import { AutoMap } from "@automapper/classes";
import { FileCleanSettingsDto } from "@/settings/dto/file-clean.settings.dto";
import { ClientSettingsDto } from "@/settings/dto/client-settings.dto";

export class IpDto {
  ip: string;
  clientIp: string;
  version: string;
}

export class SettingsDto {
  @AutoMap()
  id: number;
  @AutoMap()
  server: ServerSettingsDto;
  @AutoMap()
  client: ClientSettingsDto;
  @AutoMap()
  fileClean: FileCleanSettingsDto;
}

export class SettingsWithConnectionDto {
  // Cached
  settings: SettingsDto;

  // Manually added live
  connection: IpDto;
}
