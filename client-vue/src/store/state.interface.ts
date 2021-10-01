import { PrintersStateInterface } from "@/store/printers/printers.state";
import { ServerSettingsStateInterface } from "@/store/server-settings/server-settings.state";

export type StateInterface = PrintersStateInterface & ServerSettingsStateInterface;
