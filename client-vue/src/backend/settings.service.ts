import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import {
  PrinterFileCleanSubSetting,
  ServerSettings
} from "@/models/server-settings/server-settings.model";
import { PrinterFileCleanSettings } from "@/models/server-settings/printer-file-clean-settings.model";
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

  static async setFileHandlingClientSettings(subSettings: PrinterFileCleanSettings) {
    const path = `${ServerApi.serverSettingsRoute}`;

    return (await this.putApi(path, {
      printerFileClean: subSettings
    } as PrinterFileCleanSubSetting)) as ServerSettings;
  }
}
