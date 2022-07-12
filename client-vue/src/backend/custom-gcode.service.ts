import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";

export class CustomGcodeService extends BaseService {
  static async postEmergencyM112Command(printerId: string) {
    const path = ServerApi.sendEmergencyM112Route(printerId);

    return (await this.postApi(path)) as PrinterFileCache;
  }
}
