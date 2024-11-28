import { KeyDiffCache } from "@/utils/cache/key-diff.cache";
import { PrinterCache } from "@/state/printer.cache";
import { join } from "path";
import { superRootPath } from "@/utils/fs.utils";
import { AppConstants } from "@/server.constants";
import { existsSync } from "node:fs";
import { readFileSync } from "fs";

export interface CachedPrinterThumbnail {
  id: string;
  thumbnailBase64: string;
}

export class PrinterThumbnailCache extends KeyDiffCache<CachedPrinterThumbnail> {
  printerCache: PrinterCache;
  constructor({ printerCache }: { printerCache: PrinterCache }) {
    super();
    this.printerCache = printerCache;
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

  async setPrinterThumbnail(id: string, imageData: string) {
    await this.setKeyValue(id, { id: id, thumbnailBase64: imageData });
  }

  async unsetPrinterThumbnail(id: string) {
    await this.deleteKeyValue(id);
  }
}
