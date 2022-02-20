import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterGroup } from "@/models/printers/printer-group.model";

export class PrinterGroupService extends BaseService {
  static async getGroups() {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.getApi<PrinterGroup[]>(path)) as PrinterGroup[];
  }

  static async updateGroupName(groupId: string, name: string) {
    const path = `${ServerApi.updatePrinterGroupNameRoute(groupId)}/`;

    return (await this.patchApi(path, { name })) as PrinterGroup;
  }

  static async deleteGroup(groupId: string) {
    const path = `${ServerApi.getPrinterGroupRoute(groupId)}/`;

    return await this.deleteApi(path);
  }

  static async addPrinterToGroup(
    groupId: string,
    { printerId, location }: { printerId: string; location: string }
  ) {
    const path = `${ServerApi.getPrinterFromGroupRoute(groupId)}/`;

    return (await this.postApi(path, { printerId, location })) as PrinterGroup;
  }

  static async deletePrinterFromGroup(groupId: string, printerId: string) {
    const path = `${ServerApi.getPrinterFromGroupRoute(groupId)}/`;

    return (await this.deleteApi(path, { printerId })) as PrinterGroup;
  }

  static async syncLegacyGroups() {
    const path = `${ServerApi.printerGroupSyncLegacyRoute}/`;

    return (await this.postApi(path)) as PrinterGroup[];
  }
}
