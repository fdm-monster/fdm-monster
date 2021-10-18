import { Printer } from "@/models/printers/printer.model";
import { PrinterGroup } from "@/models/printers/printer-group.model";

export interface TestProgressDetails {
  connected: boolean;
  apiOk?: boolean;
  apiKeyNotGlobal?: boolean;
  apiKeyOk?: boolean;
  websocketBound?: boolean;
}

export interface TrackedUpload {
  correlationToken: string;
  startedAt: number;
  multerFile: {
    [k: string]: number;
  };
  progress: {
    percent: number;
    [k: string]: number;
  };
}

export interface PrinterSseMessage {
  printers: Printer[];
  printerGroups: PrinterGroup[];
  testPrinter: Printer;
  trackedUploads: TrackedUpload[];
  testProgress: TestProgressDetails;
}
