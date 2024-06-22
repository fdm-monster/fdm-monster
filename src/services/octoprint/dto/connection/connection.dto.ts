import { ConnectionState } from "@/services/octoprint/dto/connection/connection-state.type";

export interface ConnectionDto {
  current: Current;
  options: Options;
}

export interface Current {
  state: ConnectionState;
  port: string;
  baudrate: number;
  printerProfile: string;
}

export interface Options {
  ports: string[];
  baudrates: number[];
  printerProfiles: PrinterProfile[];
  portPreference: string;
  baudratePreference: number;
  printerProfilePreference: string;
  autoconnect: boolean;
}

export interface PrinterProfile {
  name: string;
  id: string;
}
