import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";

export class PrinterFilesService extends BaseService {
  static async getFiles(printerId: string, recursive = false) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=local&recursive=${recursive}`;

    return this.getApi(path);
  }

  static async deleteFile(printerId: string, fullPath: string) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=local&fullPath=${fullPath}`;

    return this.deleteApi(path);
  }
}
