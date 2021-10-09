import { VisualState, WebsocketState } from "@/models/printers/visual-state.model";
import { CostSettings } from "@/models/printers/cost-settings.model";
import { PrinterCurrentJob, PrinterJob } from "@/models/printers/printer-current-job.model";
import { FileList } from "@/models/printers/file-list.model";
import { ConnectionOptions } from "@/models/printers/connection-options.model";
import { PrinterProfile } from "@/models/printers/printer-profile.model";

export interface Printer {
  id: string;
  correlationToken?: string;
  printerState: VisualState;
  hostState: VisualState;
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

  fileList: FileList;
  connectionOptions: ConnectionOptions;
  currentProfile: PrinterProfile;
  octoPrintSystemInfo: any;
  corsCheck: true;
  stepSize: 0.1 | 1 | 10 | 100;
  systemChecks: any;
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
  groups: any[];
  gcodeScripts: any;
  octoPrintVersion: string;
  selectedFilament: any[];
}
