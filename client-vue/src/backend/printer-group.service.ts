import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterGroup } from "@/models/printers/printer-group.model";

export class PrinterGroupService extends BaseService {
  static async getGroups() {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.getApi<PrinterGroup[]>(path)) as PrinterGroup[];
  }

  static async syncLegacyGroups() {
    const path = `${ServerApi.printerGroupSyncLegacyRoute}/`;

    return (await this.postApi(path)) as PrinterGroup[];
  }
}
