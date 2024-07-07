export const printerInfoStates = {
  error: "error",
  ready: "ready",
  startup: "startup",
  shutdown: "shutdown",
};
export const printerInfoStatesList = Object.keys(printerInfoStates);
export type PrinterInfoState = keyof typeof printerInfoStates;

export interface PrinterInfoDto {
  state: PrinterInfoState;
  state_message: string;
  hostname: string;
  software_version: string;
  cpu_info: string;
  klipper_path: string;
  python_path: string;
  log_file: string;
  config_file: string;
}
