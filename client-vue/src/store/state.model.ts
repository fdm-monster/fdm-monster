import { ServerSettings } from "@/models/server-settings.model";
import { Printer } from "@/models/printers/printer.model";

export interface State {
  serverSettings?: ServerSettings;
  printers?: Printer[];
}
