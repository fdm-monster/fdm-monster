import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterFile } from "@/models/printers/printer-file.model";

export class PrinterFilesService extends BaseService {
  static async getFiles(printerId: string, recursive = false) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=local&recursive=${recursive}`;

    return (await this.getApi(path)) as PrinterFile[];
  }

  static async deleteFile(printerId: string, fullPath: string) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=local&fullPath=${fullPath}`;

    return this.deleteApi(path);
  }
}
