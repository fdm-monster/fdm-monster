import { FileUploadCommands } from "@/models/printers/file-upload-commands.model";
import { Printer } from "@/models/printers/printer.model";
import { QueuedUpload } from "@/models/uploads/queued-upload.model";

/**
 * Multiple files => 1 printer
 * @param printer
 * @param files
 * @param printedFileName
 */
export function convertPrinterMultiFileToQueue(
  printer: Printer,
  files: File[],
  printedFileName: string | null
): QueuedUpload[] {
  if (!printer) return [];

  return files.map((f) => {
    const commands: FileUploadCommands = {
      select: false,
      print: false,
      overrideBedTemp: false,
      bedTemp: 50,
    };
    if (f.name === printedFileName) {
      commands.print = true;
    }

    return {
      file: f,
      printer,
      commands,
    };
  }) as QueuedUpload[];
}

/**
 * 1 file => multiple printers
 * @param printers
 * @param file
 * @param commands
 */
export function convertMultiPrinterFileToQueue(
  printers: Printer[],
  file: File,
  commands: FileUploadCommands = {
    select: true,
    print: true,
    overrideBedTemp: false,
    bedTemp: 50,
  }
) {
  if (!printers?.length || !file) return [];

  return printers.map((p) => {
    return {
      file,
      printer: p,
      commands,
    };
  }) as QueuedUpload[];
}
