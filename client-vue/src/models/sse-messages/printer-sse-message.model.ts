import { Printer } from "@/models/printers/printer.model";
import { PrinterGroup } from "@/models/printers/printer-group.model";

export interface TestProgressDetails {
  connected: boolean;
  apiOk?: boolean;
  apiKeyNotGlobal?: boolean;
  apiKeyOk?: boolean;
  websocketBound?: boolean;
}

export interface PrinterSseMessage {
  printers: Printer[];
  printerGroups: PrinterGroup[];
  testPrinter: Printer;
  testProgress: TestProgressDetails;
}
