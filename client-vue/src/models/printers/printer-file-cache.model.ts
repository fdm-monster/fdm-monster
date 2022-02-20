import { PrinterFile } from "@/models/printers/printer-file.model";

export interface PrinterFileCache {
  files: PrinterFile[];
  free: number;
  total: number;
}
