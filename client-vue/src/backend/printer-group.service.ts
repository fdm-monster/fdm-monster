import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterGroup } from "@/models/printers/printer-group.model";
import {
  CreatePrinterGroup,
  getDefaultCreatePrinterGroup
} from "@/models/printer-groups/crud/create-printer-group.model";
import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export class PrinterGroupService extends BaseService {
  static convertPrinterGroupToCreateForm(printerGroup: CreatePrinterGroup) {
    // Inverse transformation
    const newFormData = getDefaultCreatePrinterGroup();

    newFormData.id = printerGroup.id;
    newFormData.name = printerGroup.name || newRandomNamePair();
    newFormData.printers = [];
    newFormData.location = printerGroup.location || { x: 0, y: 0 };

    return newFormData;
  }

  static async getGroups() {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.getApi<PrinterGroup[]>(path)) as PrinterGroup[];
  }

  static async createGroup(printerGroup: CreatePrinterGroup) {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.postApi(path, printerGroup)) as PrinterGroup;
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
