import { HostState, PrinterState, WebsocketState } from "@/models/printers/visual-state.model";
import { PrinterCurrentJob, PrinterJob } from "@/models/printers/printer-current-job.model";
import { ConnectionOptions } from "@/models/printers/connection-options.model";
export interface ApiAccessibility {
  accessible: boolean;
  retryable: boolean;
  reason: string;
}

export interface LoginDetails {
  apiKey: string;
  printerURL: string;
}

export interface LastPrintedFile {
  fileName: string;
  editTimestamp: number;
  parsedColor: string;
  parsedVisualizationRAL: number;
  parsedAmount: number;
  parsedMaterial: string;
  parsedOrderCode: string;
}

export interface Printer {
  id: string;
  correlationToken?: string;
  printerState: PrinterState;
  lastPrintedFile: LastPrintedFile;
  hostState: HostState;
  apiAccessibility: ApiAccessibility;
  webSocketState: WebsocketState;
  currentJob: PrinterCurrentJob | PrinterJob;

  enabled: boolean;
  disabledReason: string;
  sortIndex: number;
  printerName: string;
  webSocketURL: string;
  apiKey: string;
  printerURL: string;

  connectionOptions: ConnectionOptions;
  octoPrintSystemInfo: any;
  stepSize: 0.1 | 1 | 10 | 100;
  octoPi: {
    version: string;
    model: string;
  };
  octoPrintVersion: string;
}
