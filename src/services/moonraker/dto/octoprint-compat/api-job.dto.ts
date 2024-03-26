export interface ApiJobDto {
  job: Job;
  progress: Progress;
  state: string;
}

export interface Job {
  file: File;
  estimatedPrintTime: any;
  filament: Filament;
  user: any;
}

export interface File {
  name: any;
}

export interface Filament {
  length: any;
}

export interface Progress {
  completion: any;
  filepos: any;
  printTime: any;
  printTimeLeft: any;
  printTimeOrigin: any;
}
