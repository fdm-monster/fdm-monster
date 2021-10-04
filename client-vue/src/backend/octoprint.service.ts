import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";

export class OctoPrintService extends BaseService {
  static async getFiles(printerId: string, recursive = false) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?recursive=${recursive}`;

    return this.getApi(path);
  }

  static async deleteFile(printerId: string, fullPath: string) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?path=local&fullPath=${fullPath}`;

    return this.deleteApi(path);
  }
}
