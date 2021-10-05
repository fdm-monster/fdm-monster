import { PrinterFile } from "@/models/printers/printer-file.model";

export interface FileList {
  files: PrinterFile[];
  fileCount: number;
  folders: string[];
  folderCount: number;
}
