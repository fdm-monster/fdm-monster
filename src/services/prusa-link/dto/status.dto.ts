export interface PL_StatusDto {
  printer: PL_PrinterDto;
  storage: PL_StorageDto;
  job?: PL_JobDto;
  transfer?: PL_TransferDto;
  camera?: PL_CameraDto;
}

export interface PL_JobDto {
  id: number;
  progress: number;
  time_remaining: number;
  time_printing: number;
}

export interface PL_PrinterDto {
  state: string;
  temp_nozzle: number;
  target_nozzle: number;
  temp_bed: number;
  target_bed: number;
  axis_x: number;
  axis_y: number;
  axis_z: number;
  flow: number;
  speed: number;
  fan_hotend: number;
  fan_print: number;
  status_printer: PL_StatusPrinterDto;
  status_connect: PL_StatusConnectDto;
}

export interface PL_StatusPrinterDto {
  ok: boolean;
  message: string;
}

export interface PL_StatusConnectDto {
  ok: boolean;
  message: string;
}

export interface PL_TransferDto {
  id: number;
  time_transferring: number;
  progress: number;
  data_transferred: number;
}

export interface PL_StorageDto {
  name: string;
  path: string;
  read_only: boolean;
  free_space: number;
}

export interface PL_CameraDto {
  id: string;
}
