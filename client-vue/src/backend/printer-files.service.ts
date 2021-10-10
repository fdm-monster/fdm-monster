import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { FileLocation } from "@/models/api/octoprint.definition";

export class PrinterFilesService extends BaseService {
  static async getFiles(printerId: string, recursive = false, location: FileLocation = "local") {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=${location}&recursive=${recursive}`;

    return (await this.getApi(path)) as PrinterFile[];
  }

  static async uploadFiles(printerId: string, files: FileList, location: FileLocation = "local") {
    const path = ServerApi.printerFilesUploadRoute(printerId, location);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[" + i + "]", files[i]);
    }

    return this.postApi(path, formData, { unwrap: false });
  }

  static async deleteFile(printerId: string, fullPath: string, location = "local") {
    const path = `${ServerApi.printerFilesRoute} /${printerId}/?location=${location}&fullPath=${fullPath}`;

    return this.deleteApi(path);
  }
}
