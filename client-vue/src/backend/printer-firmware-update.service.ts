import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrusaFirmwareReleaseModel } from "@/models/plugins/firmware-updates/prusa-firmware-release.model";
import { PrinterFirmwareStateResponse } from "@/models/plugins/firmware-updates/printer-firmware-state.model";

export class PrinterFirmwareUpdateService extends BaseService {
  static async loadFirmwareUpdateState() {
    const path = `${ServerApi.pluginFirmwareUpdateRoute}`;

    return (await this.getApi(path)) as PrinterFirmwareStateResponse;
  }

  static async getFirmwareReleases() {
    const path = `${ServerApi.pluginFirmwareReleasesRoute}`;

    return (await this.getApi(path)) as PrusaFirmwareReleaseModel[];
  }
}
