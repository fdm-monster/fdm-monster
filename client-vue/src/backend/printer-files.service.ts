import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { PrinterFile } from "@/models/printers/printer-file.model";
import { FileLocation } from "@/models/api/octoprint.definition";
import { FileUploadCommands } from "@/models/printers/file-upload-commands.model";
import { PrinterFileCache } from "@/models/printers/printer-file-bucket.model";

export class PrinterFilesService extends BaseService {
  static async getFiles(printerId: string, recursive = false, location: FileLocation = "local") {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=${location}&recursive=${recursive}`;

    return (await this.getApi(path)) as PrinterFile[];
  }

  /**
   * A nice alternative for offline or disabled printers
   * @param printerId
   */
  static async getFileCache(printerId: any) {
    const path = `${ServerApi.printerFilesCacheRoute(printerId)}`;

    return (await this.getApi(path)) as PrinterFileCache;
  }

  static async uploadFiles(
    printerId: string,
    files: File[],
    commands: FileUploadCommands = { select: true, print: true },
    location: FileLocation = "local"
  ) {
    const path = ServerApi.printerFilesUploadRoute(printerId, location);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[" + i + "]", files[i]);
    }

    // Cant print more than 1 file at a time
    if (files.length === 1) {
      if (commands.select) {
        formData.append("select", "true");
      }
      if (commands.print) {
        formData.append("print", "true");
      }
    }

    return this.postApi(path, formData, { unwrap: false });
  }

  static async deleteFile(printerId: string, fullPath: string, location = "local") {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?location=${location}&fullPath=${fullPath}`;

    return this.deleteApi(path);
  }
}
