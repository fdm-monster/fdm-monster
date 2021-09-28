import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";

export class PrintersService extends BaseService {
  static async getPrinters() {
    const path = ServerApi.printerRoute;

    return await this.getApi(path);
  }

  static async toggleEnabled(printerId: string, enabled: boolean) {
    const path = ServerApi.printerEnabledRoute(printerId);

    return await this.patchApi(path, { enabled });
  }
}
