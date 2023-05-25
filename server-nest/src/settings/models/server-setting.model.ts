import { AutoMap } from "@automapper/classes";

export class ServerSetting {
  @AutoMap()
  requireLogin: boolean;
}
