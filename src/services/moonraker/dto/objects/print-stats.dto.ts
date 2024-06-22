export const printerStates = {
  standby: "standby",
  printing: "printing",
  paused: "paused",
  complete: "complete",
  cancelled: "cancelled",
  error: "error",
};
export const printersStatesList = Object.keys(printerStates);
export type PrinterState = keyof typeof printerStates;

export interface PrintStatsDto {
  filename: string;
  total_duration: number;
  print_duration: number;
  filament_used: number;
  state: PrinterState;
  message: string;
  info: Info;
}

export interface Info {
  // Slicer dependent, f.e. requires SET_PRINT_STATS_INFO command
  total_layer: null | any;
  current_layer: null | any;
}
