import { BaseService } from "@/backend/base.service";
import { ServerApi } from "@/backend/server.api";
import { FileUploadCommands } from "@/models/printers/file-upload-commands.model";
import { PrinterFileCache } from "@/models/printers/printer-file-cache.model";
import { ClearedFilesResult, PrinterFile } from "@/models/printers/printer-file.model";
import Vue from "vue";
import { infoMessageEvent } from "@/event-bus/alert.events";

export class PrinterFileService extends BaseService {
  static async getFiles(printerId: string, recursive = false) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?recursive=${recursive}`;

    return (await this.getApi(path)) as PrinterFileCache;
  }

  /**
   * A nice alternative for offline or disabled printers
   * @param printerId
   */
  static async getFileCache(printerId: any) {
    const path = `${ServerApi.printerFilesCacheRoute(printerId)}`;

    return (await this.getApi(path)) as PrinterFileCache;
  }

  static async selectAndPrintFile(printerId: string, filePath: string, print = true) {
    const path = ServerApi.printerFilesSelectAndPrintRoute(printerId);

    return await this.postApi(path, { filePath, print });
  }

  static async uploadStubFile(printerId: string, files: File[]) {
    const path = ServerApi.printerFilesUploadStubRoute;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[" + i + "]", files[i]);
    }

    return this.postUploadApi(
      path,
      formData,
      {
        onUploadProgress: this.uploadUpdateProgress
      },
      { unwrap: false }
    );
  }

  static uploadUpdateProgress(progress: ProgressEvent) {
    Vue.bus.emit(infoMessageEvent, "Browser to server uploading", progress.loaded / progress.total);
  }

  static async uploadFile(
    printerId: string,
    file: File,
    commands: FileUploadCommands = { select: true, print: true }
  ) {
    const path = ServerApi.printerFilesUploadRoute(printerId);

    const formData = new FormData();
    // Cant print more than 1 file at a time
    if (commands.select) {
      formData.append("select", "true");
    }
    if (commands.print) {
      formData.append("print", "true");
    }
    formData.append("files[0]", file);

    return this.postUploadApi(
      path,
      formData,
      {
        onUploadProgress: this.uploadUpdateProgress
      },
      { unwrap: false }
    );
  }

  static async clearFiles(printerId: string) {
    const path = `${ServerApi.printerFilesClearRoute(printerId)}`;

    return this.deleteApi<ClearedFilesResult>(path);
  }

  static async purgeFiles() {
    const path = `${ServerApi.printerFilesPurgeRoute}`;

    return this.postApi(path);
  }

  static async deleteFileOrFolder(printerId: string, filePath: string) {
    const path = `${ServerApi.printerFilesRoute}/${printerId}/?filePath=${filePath}`;

    return this.deleteApi(path);
  }

  static downloadFile(file: PrinterFile) {
    window.location.href = file.refs.download;
  }
}
