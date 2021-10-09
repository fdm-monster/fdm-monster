import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";
import { Printer } from "@/models/printers/printer.model";

export class PrintersService extends BaseService {
  static async getPrinters() {
    const path = ServerApi.printerRoute;

    return await this.getApi(path);
  }

  static async sendPrinterConnectCommand(printerId: string, connected: boolean) {
    const path = ServerApi.printerSerialConnectRoute(printerId);

    return await this.postApi(path, { connected });
  }

  static async sendPrinterDisconnectCommand(printerId: string, connected: boolean) {
    const path = ServerApi.printerSerialDisconnectRoute(printerId);

    return await this.postApi(path, { connected });
  }

  static async createPrinter(printer: Printer) {
    const path = ServerApi.printerRoute;

    return await this.postApi(path, printer);
  }

  static async deletePrinter(printerId: string) {
    const path = ServerApi.getPrinterRoute(printerId);

    return await this.deleteApi(path);
  }

  static async testConnection(printer: Printer) {
    const path = ServerApi.printerTestConnectionRoute;

    return await this.postApi(path, printer);
  }

  static async toggleEnabled(printerId: string, enabled: boolean) {
    const path = ServerApi.printerEnabledRoute(printerId);

    return await this.patchApi(path, { enabled });
  }
}
