import { OnlinePollingModel } from "@/models/online-polling.model";
import { ServerModel } from "@/models/server/server.model";

export interface ServerSettings {
  id: string;
  onlinePolling: OnlinePollingModel; // TODO finish model
  server: ServerModel;

  timeout: any; // TODO model
  filamentManager: boolean;
  filament: any; // TODO model;
  history: any; // TODO model;
  influxExport: any; // TODO model;
}
