import { PrinterFile } from "@/models/printers/printer-file.model";

export interface PrinterFileBucket {
  printerId: string;
  files: PrinterFile[];
  fileCount: number;
  free: number;
  total: number;
}
