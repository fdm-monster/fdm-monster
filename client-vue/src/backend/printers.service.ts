import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import { Printer } from "@/models/printers/printer.model";

export class PrintersService extends BaseService {
  static async getPrinters() {
    const path = ServerApi.printerRoute;

    return await this.getApi(path);
  }

  static async createPrinter(printer: Printer) {
    const path = ServerApi.printerRoute;

    return await this.postApi(path, printer);
  }

  static async toggleEnabled(printerId: string, enabled: boolean) {
    const path = ServerApi.printerEnabledRoute(printerId);

    return await this.patchApi(path, { enabled });
  }
}
