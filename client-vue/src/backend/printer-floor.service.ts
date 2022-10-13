import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { newRandomNamePair } from "@/constants/noun-adjectives.data";
import {
  getDefaultCreatePrinterFloor,
  PreCreatePrinterFloor,
  PrinterFloor,
} from "@/models/printer-floor/printer-floor.model";

export class PrinterFloorService extends BaseService {
  static convertPrinterFloorToCreateForm(printerFloor?: PrinterFloor): PreCreatePrinterFloor {
    // Inverse transformation
    const newFormData = getDefaultCreatePrinterFloor();

    newFormData._id = printerFloor?._id;
    newFormData.name = printerFloor?.name || newRandomNamePair();
    newFormData.printerGroups = [];

    newFormData.floor = (printerFloor?.floor || 1).toString();

    return newFormData;
  }

  static convertCreateFormToPrinterFloor(formData: PreCreatePrinterFloor) {
    const modifiedData: any = { ...formData };

    // Fix the string properties to become int
    modifiedData.floor = parseInt(modifiedData.floor);

    if (Number.isNaN(modifiedData.floor)) {
      throw new Error("Floor number did not convert to number.");
    }

    return modifiedData as PrinterFloor;
  }

  static async getFloors() {
    const path = `${ServerApi.printerFloorRoute}/`;

    return await this.getApi<PrinterFloor[]>(path);
  }

  static async createFloor(printerFloor: PrinterFloor) {
    const path = `${ServerApi.printerFloorRoute}/`;

    return (await this.postApi(path, printerFloor)) as PrinterFloor;
  }

  static async updateFloorName(groupId: string, name: string) {
    const path = `${ServerApi.updatePrinterFloorNameRoute(groupId)}/`;

    return (await this.patchApi(path, { name })) as PrinterFloor;
  }

  static async updateFloorNumber(groupId: string, floor: number) {
    const path = `${ServerApi.updatePrinterFloorNumberRoute(groupId)}/`;

    return (await this.patchApi(path, { floor })) as PrinterFloor;
  }

  static async deleteFloor(groupId: string) {
    const path = `${ServerApi.getPrinterFloorRoute(groupId)}/`;

    return await this.deleteApi(path);
  }

  static async addPrinterGroupToFloor(
    floorId: string,
    { printerGroupId }: { printerGroupId: string }
  ) {
    const path = `${ServerApi.addOrRemovePrinterGroupFromFloorRoute(floorId)}/`;

    return (await this.postApi(path, { printerGroupId })) as PrinterFloor;
  }

  static async deletePrinterGroupFromFloor(floorId: string, printerGroupId: string) {
    const path = `${ServerApi.addOrRemovePrinterGroupFromFloorRoute(floorId)}/`;

    return (await this.deleteApi(path, { printerGroupId })) as PrinterFloor;
  }
}
