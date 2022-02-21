import { OnlinePollingModel } from "@/models/server-settings/online-polling.model";
import { ServerModel } from "@/models/server-settings/server.model";
import { FileHandlingSettings } from "@/models/server-settings/file-handling-settings.model";

export interface ServerSettings {
  id: string;
  onlinePolling: OnlinePollingModel; // TODO finish model
  server: ServerModel;
  printerFileClean: FileHandlingSettings;

  timeout: any; // TODO model
  filamentManager: boolean;
  filament: any; // TODO model;
  history: any; // TODO model;
  influxExport: any; // TODO model;
}
