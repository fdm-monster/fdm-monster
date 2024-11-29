import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { PrinterCache } from "@/state/printer.cache";
import { join } from "path";
import { superRootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { existsSync } from "node:fs";
import { readFileSync } from "fs";
import { LoginDto } from "@/services/interfaces/login.dto";
import { OctoprintClient } from "@/services/octoprint/octoprint.client";
import { gcodeMaxLinesToRead, gcodeScanningChunkSize } from "@/utils/gcode.utils";

export interface CachedPrinterThumbnail {
  id: string;
  thumbnailBase64: string;
}

export class PrinterThumbnailCache extends KeyDiffCache<CachedPrinterThumbnail> {
  printerCache: PrinterCache;
  octoprintClient: OctoprintClient;
  constructor({ printerCache, octoprintClient }: { printerCache: PrinterCache; octoprintClient: OctoprintClient }) {
    super();
    this.printerCache = printerCache;
    this.octoprintClient = octoprintClient;
  }

  async loadCache() {
    const printers = await this.printerCache.listCachedPrinters();
    const baseFolder = join(superRootPath(), AppConstants.defaultPrinterThumbnailsStorage);

    Object.keys(this.keyValueStore).forEach((key) => {
      delete this.keyValueStore[key];
    });

    for (const printer of printers) {
      const printerIdStr = printer.id.toString();
      const thumbnailFile = join(baseFolder, printer.id.toString() + ".dat");
      if (existsSync(thumbnailFile)) {
        const data = readFileSync(thumbnailFile, "utf8");
        await this.setPrinterThumbnail(printerIdStr, data);
      }
    }
  }

  async loadPrinterThumbnailRemotely(login: LoginDto, file: string, remote: boolean = false) {
    await this.readRemoteGcodeLines(login, file, gcodeMaxLinesToRead);
  }

  async loadPrinterThumbnailLocally(login: LoginDto, file: string, originalFileName: string) {}

  async setPrinterThumbnail(id: string, imageData: string) {
    await this.setKeyValue(id, { id: id, thumbnailBase64: imageData });
  }

  async unsetPrinterThumbnail(id: string) {
    await this.deleteKeyValue(id);
  }

  private async readRemoteGcodeLines(login: LoginDto, file: string, numberOfLines: number, fromEnd: boolean = false) {
    const fileData = await this.octoprintClient.getFile(login, file);
    const fileSize = fileData.size;

    let lines: string[] = [];
    let position = fileSize;
    let iterationsLeft = 5;

    while (lines.length <= numberOfLines && (fromEnd ? position > 0 : position < fileSize)) {
      iterationsLeft--;
      if (iterationsLeft <= 0) {
        throw new Error("Too many iterations reached, 'readRemoteGcodeLines' aborted");
      }

      const bytesToRead = Math.min(gcodeScanningChunkSize, fromEnd ? position : fileSize - position);
      const start = fromEnd ? position - bytesToRead : position;
      const end = fromEnd ? position : position + bytesToRead;
      position = fromEnd ? start : end;

      const remoteChunk = await this.octoprintClient.getFileChunk(login, file, start, end);
      const chunkLines = remoteChunk.data.split("\n");
      if (fromEnd) {
        lines = chunkLines.concat(lines);
      } else {
        lines = lines.concat(chunkLines);
      }
    }

    return fromEnd ? lines.slice(-numberOfLines) : lines.slice(0, numberOfLines);
  }
}
