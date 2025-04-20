export interface PL_JobStateDto {
  state: string;
  job: PL_JobDto;
  progress: PL_ProgressDto;
}

export interface PL_JobDto {
  estimatedPrintTime: number;
  file: PL_FileDto;
}

export interface PL_FileDto {
  name: string;
  path: string;
  display: string;
}

export interface PL_ProgressDto {
  printTimeLeft: number;
  completion: number;
  printTime: number;
}
