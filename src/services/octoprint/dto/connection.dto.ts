export interface ConnectionDto {
  current: Current;
  options: Options;
}

export type ConnectionState =
  | "Operational"
  | "Printing"
  | "Starting print from SD"
  | "Starting to send file to SD"
  | "Printing from SD"
  | "Transferring file to SD"
  | "Sending file to SD"
  | "Starting"
  | "Pausing"
  | "Paused"
  | "Resuming"
  | "Finishing"
  | "Cancelling"
  | "Error"
  | "Offline"
  | "Offline after error"
  | "Opening serial connection"
  | "Detecting serial connection"
  | "Unknown State";

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
