import { AutoMap } from "@automapper/classes";

export class ServerSettingsDto {
  @AutoMap()
  requireLogin: boolean;
}
