import { Printer } from "@/models/printers/printer.model";

export interface TestProgressDetails {
  connected: boolean;
  apiOk?: boolean;
  apiKeyNotGlobal?: boolean;
  apiKeyOk?: boolean;
  websocketBound?: boolean;
}

export interface PrinterSseMessage {
  printers: Printer[];
  testPrinter: Printer;
  testProgress: TestProgressDetails;
}
