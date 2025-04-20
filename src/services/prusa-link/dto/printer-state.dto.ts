export interface PL_PrinterStateDto {
  temperature: PL_TemperatureDto;
  state: PL_StateDto;
  telemetry: PL_TelemetryDto;
}

export interface PL_TelemetryDto {
  "temp-bed": number;
  "temp-nozzle": number;
  "print-speed": number;
  "z-height": number;
  material: string;
}

export interface PL_TemperatureDto {
  tool0: PL_Tool0Dto;
  bed: PL_BedDto;
}

export interface PL_Tool0Dto {
  actual: number;
  target: number;
  display: number;
  offset: number;
}

export interface PL_BedDto {
  actual: number;
  target: number;
  offset: number;
}

export interface PL_StateDto {
  text: string;
  flags: PL_FlagsDto;
}

export interface PL_FlagsDto {
  operational: boolean;
  paused: boolean;
  printing: boolean;
  cancelling: boolean;
  pausing: boolean;
  error: boolean;
  sdReady: boolean;
  closedOnError: boolean;
  ready: boolean;
  busy: boolean;
}
