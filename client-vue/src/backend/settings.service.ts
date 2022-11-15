import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import {
  PrinterFileCleanSubSetting,
  ServerSettings,
} from "@/models/server-settings/server-settings.model";
import { PrinterFileCleanSettings } from "@/models/server-settings/printer-file-clean-settings.model";
import { WhitelistSettings } from "@/models/server-settings/server.model";

export class SettingsService extends BaseService {
  static async getServerSettings() {
    const path = ServerApi.serverSettingsRoute;

    return (await this.getApi(path)) as ServerSettings;
  }

  static async setWhitelistSettings(subSettings: WhitelistSettings) {
    const path = `${ServerApi.serverWhitelistSettingRoute}`;

    return (await this.putApi(path, subSettings as WhitelistSettings)) as ServerSettings;
  }

  static async setFileCleanSettings(subSettings: PrinterFileCleanSettings) {
    const path = `${ServerApi.serverSettingsRoute}`;

    return (await this.putApi(path, {
      printerFileClean: subSettings,
    } as PrinterFileCleanSubSetting)) as ServerSettings;
  }
}
