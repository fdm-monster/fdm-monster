import { Printer } from "@/models/printers/printer.model";

export interface PrinterSseMessage {
  printers: Printer[];
  testPrinter: Printer;
}
