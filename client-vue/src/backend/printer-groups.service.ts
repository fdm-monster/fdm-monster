import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";

export class PrinterGroupsService extends BaseService {
  static async getGroups() {
    const path = `${ServerApi.printerGroupsRoute}/`;

    return this.getApi(path);
  }
}
