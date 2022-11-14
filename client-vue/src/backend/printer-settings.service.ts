import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";

export class PrinterSettingsService extends BaseService {
  static async getSettings(printerId: string) {
    const path = `${ServerApi.getPrinterSettingsRoute(printerId)}`;

    return await this.getApi(path);
  }

  /**
   * Enabled: true => idle, enabled: false => disabled
   * @param printerId
   * @param enabled
   */
  static async setGCodeAnalysis(printerId: string, enabled = false) {
    const path = `${ServerApi.setPrinterSettingsGCodeAnalysisRoute(printerId)}`;

    return await this.postApi(path, { enabled });
  }

  static async syncPrinterName(printerId: string) {
    const path = `${ServerApi.syncPrinterNameSettingRoute(printerId)}`;

    return await this.postApi(path);
  }
}
