import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterGroup } from "@/models/printers/printer-group.model";

export class PrinterGroupsService extends BaseService {
  static async getGroups() {
    const path = `${ServerApi.printerGroupsRoute}/`;

    return (await this.getApi<PrinterGroup[]>(path)) as PrinterGroup[];
  }
}
