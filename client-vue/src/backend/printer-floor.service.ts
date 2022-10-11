import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { newRandomNamePair } from "@/constants/noun-adjectives.data";
import {
  getDefaultCreatePrinterFloor,
  PrinterFloor,
} from "@/models/printer-floor/printer-floor.model";

export class PrinterFloorService extends BaseService {
  static convertPrinterFloorToCreateForm(printerFloor: PrinterFloor): PrinterFloor {
    // Inverse transformation
    const newFormData = getDefaultCreatePrinterFloor();

    newFormData._id = printerFloor._id;
    newFormData.name = printerFloor.name || newRandomNamePair();
    newFormData.printerGroups = [];

    newFormData.floor = printerFloor.floor;

    return newFormData;
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

  static async deleteFloor(groupId: string) {
    const path = `${ServerApi.getPrinterFloorRoute(groupId)}/`;

    return await this.deleteApi(path);
  }

  static async addPrinterGroupToFloor(
    floorId: string,
    { printerGroupId }: { printerGroupId: string }
  ) {
    const path = `${ServerApi.getPrinterFloorRoute(floorId)}/`;

    return (await this.postApi(path, { printerGroupId })) as PrinterFloor;
  }

  static async deletePrinterGroupFromFloor(floorId: string, groupId: string) {
    const path = `${ServerApi.getPrinterFromGroupRoute(floorId)}/`;

    return (await this.deleteApi(path, { groupId })) as PrinterFloor;
  }
}
