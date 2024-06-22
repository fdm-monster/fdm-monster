export interface JobDto {
  file: JobFileDto;
  estimatedPrintTime: number;
  averagePrintTime: any;
  lastPrintTime: any;
  filament: Filament;
  user: string;
}

export interface JobFileDto {
  name: string;
  path: string;
  display: string;
  origin: string;
  size: number;
  date: number;
}

export interface Filament {
  tool0: Tool0;
}

export interface Tool0 {
  length: number;
  volume: number;
}
