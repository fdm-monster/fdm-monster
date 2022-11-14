import { ServerModel } from "@/models/server-settings/server.model";
import { PrinterFileCleanSettings } from "@/models/server-settings/printer-file-clean-settings.model";

export type PrinterFileCleanSubSetting = {
  printerFileClean: PrinterFileCleanSettings;
};

export interface ServerSettings {
  id: string;
  server: ServerModel;
  printerFileClean: PrinterFileCleanSettings;
  timeout: any; // TODO model
}
