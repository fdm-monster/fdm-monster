import { PrinterFile } from "@/models/printers/printer-file.model";

export interface PrinterFileCache {
  files: PrinterFile[];
  fileCount: number;
  free: number;
  total: number;
}

export interface PrinterFileBucket extends PrinterFileCache {
  printerId: string;
}
