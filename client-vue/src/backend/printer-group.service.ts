import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterGroup } from "@/models/printer-groups/printer-group.model";
import {
  CreatePrinterGroup,
  getDefaultCreatePrinterGroup,
  PreCreatePrinterGroup,
} from "@/models/printer-groups/crud/create-printer-group.model";
import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export class PrinterGroupService extends BaseService {
  static convertPrinterGroupToCreateForm(printerGroup?: PrinterGroup): PreCreatePrinterGroup {
    // Inverse transformation
    const newFormData = getDefaultCreatePrinterGroup();

    newFormData.id = printerGroup?._id;
    newFormData.name = printerGroup?.name || newRandomNamePair();
    newFormData.printers = [];

    newFormData.location = {
      x: printerGroup?.location?.x.toString() || "0",
      y: printerGroup?.location.y?.toString() || "0",
    };

    return newFormData;
  }

  static convertCreateFormToPrinterGroup(formData: PreCreatePrinterGroup) {
    const modifiedData: any = { ...formData };

    // Fix the string properties to become int
    modifiedData.location.x = parseInt(modifiedData.location.x);
    modifiedData.location.y = parseInt(modifiedData.location.y);

    if (Number.isNaN(modifiedData.location.x) || Number.isNaN(modifiedData.location.y)) {
      throw new Error("Group location X or Y did not convert to number.");
    }

    return modifiedData as CreatePrinterGroup;
  }

  static async getGroups() {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.getApi<PrinterGroup[]>(path)) as PrinterGroup[];
  }

  static async createGroup(printerGroup: CreatePrinterGroup) {
    const path = `${ServerApi.printerGroupRoute}/`;

    return (await this.postApi(path, printerGroup)) as PrinterGroup;
  }

  static async updateGroup(printerGroupId: string, printerGroup: CreatePrinterGroup) {
    const path = `${ServerApi.updatePrinterGroupRoute(printerGroupId)}`;
    return (await this.patchApi(path, printerGroup)) as PrinterGroup;
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
}
