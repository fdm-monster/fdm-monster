import { Printer } from "@/models/printers/printer.model";

// Extensibility options for future use
export interface PrinterSseMessage {
  printers: Printer[];
  testPrinters: Printer[];
};
