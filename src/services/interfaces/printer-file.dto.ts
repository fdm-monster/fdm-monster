export interface LastPrintMoment {
  date: number;
  printTime: number;
  success: boolean;
}

export interface Prints {
  failure: number;
  last: LastPrintMoment;
  success: number;
}

export interface Refs {
  download: string;
  resource: string;
  // model?: string;
}

export interface OctoPrintStatisticsDto {
  averagePrintTime: {
    _default: number;
    [k: string]: number; //profile name like _default
  };
  lastPrintTime: {
    _default: number;
    [k: string]: number; //profile name like _default
  };
}
