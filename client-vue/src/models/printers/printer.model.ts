import { HostState, PrinterState, WebsocketState } from "@/models/printers/visual-state.model";
import { CostSettings } from "@/models/printers/cost-settings.model";
import { PrinterCurrentJob, PrinterJob } from "@/models/printers/printer-current-job.model";
import { ConnectionOptions } from "@/models/printers/connection-options.model";
import { PrinterProfile } from "@/models/printers/printer-profile.model";

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
  costSettings: CostSettings;
  currentJob: PrinterCurrentJob | PrinterJob;

  enabled: boolean;
  display: true;
  sortIndex: number;
  printerName: string;
  webSocketURL: string;
  camURL: string;
  apiKey: string;
  printerURL: string;
  group: string;

  connectionOptions: ConnectionOptions;
  currentProfile: PrinterProfile;
  octoPrintSystemInfo: any;
  corsCheck: true;
  stepSize: 0.1 | 1 | 10 | 100;
  alerts: null;
  otherSettings: {
    temperatureTriggers: any;
    system: {
      commands: any;
    };
    webCamSettings: any;
  };
  octoPi: {
    version: string;
    model: string;
  };
  tools: {
    time: number;
    bed: { actual: number };
    chamber: {
      actual: number;
    };
  }[];
  gcodeScripts: any;
  octoPrintVersion: string;
  selectedFilament: any[];
}
