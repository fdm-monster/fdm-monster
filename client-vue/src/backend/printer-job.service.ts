import { ServerApi } from "@/backend/server.api";
import { BaseService } from "@/backend/base.service";

export class PrinterJobService extends BaseService {
  static async stopPrintJob(printerId: string) {
    const path = ServerApi.printerStopJobRoute(printerId);

    return await this.postApi(path);
  }
}
