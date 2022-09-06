import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrusaFirmwareReleaseModel } from "@/models/plugins/firmware-updates/prusa-firmware-release.model";
import {
  PrinterFirmwareStateResponse,
  PrinterInstalledResponse
} from "@/models/plugins/firmware-updates/printer-firmware-state.model";

export class PrinterFirmwareUpdateService extends BaseService {
  static async installPlugin(printerId: string) {
    const path = `${ServerApi.installFirmwareUpdatePluginRoute(printerId)}`;
    return (await this.postApi(path)) as PrinterInstalledResponse;
  }

  static async loadFirmwareUpdateState() {
    const path = `${ServerApi.pluginFirmwareUpdateRoute}`;

    return (await this.getApi(path)) as PrinterFirmwareStateResponse;
  }

  static async getFirmwareReleases() {
    const path = `${ServerApi.pluginFirmwareReleasesRoute}`;

    return (await this.getApi(path)) as PrusaFirmwareReleaseModel[];
  }
}
