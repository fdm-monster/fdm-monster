import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import { ServerSettings } from "@/models/server-settings.model";
import { FileHandlingSettings } from "@/models/client-settings/file-handling-settings.model";
import { ClientSettings } from "@/models/client-settings/client-settings.model";

export class SettingsService extends BaseService {
  static async getServerSettings() {
    const path = ServerApi.serverSettingsRoute;

    return (await this.getApi(path)) as ServerSettings;
  }

  static async getClientSettings() {
    const path = ServerApi.clientSettingsRoute;

    return (await this.getApi(path)) as ClientSettings;
  }

  static async setFileHandlingClientSettings(subSettings: FileHandlingSettings) {
    const path = `${ServerApi.clientSettingsRoute}`;

    return (await this.putApi(path, { fileHandling: subSettings })) as ClientSettings;
  }
}
