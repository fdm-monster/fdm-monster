import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import { ServerSettings } from "@/models/server-settings.model";

export class SettingsService extends BaseService {
  static async getServerSettings() {
    const path = ServerApi.serverSettingsRoute;

    return (await this.getApi(path)) as ServerSettings;
  }
}
