import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";

export class PrintersService extends BaseService {
  static async getPrinters() {
    const path = ServerApi.printerRoute;

    return await this.getApi(path);
  }
}
