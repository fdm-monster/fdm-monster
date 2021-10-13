import { Printer } from "@/models/printers/printer.model";

export const isPrinterStoppable = (printer: Printer) =>
  printer.printerState?.flags.printing || printer.printerState.flags.paused;
