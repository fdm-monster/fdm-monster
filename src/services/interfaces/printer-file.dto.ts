import { GcodeAnalysisDto } from "@/services/interfaces/gcode-analysis.dto";
import { IdDto, IdType } from "@/shared.constants";

export interface LastPrintMoment {
  date: number;
  printTime: number;
  success: boolean;
}

export interface Prints {
  failure: number;
  last: LastPrintMoment;
  success: boolean;
}

export interface Refs {
  download: string;
  resource: string;
}

export interface Statistics {
  averagePrintTime: {
    [k: string]: number; //profile name like _default
  };
  lastPrintTime: {
    [k: string]: number; //profile name like _default
  };
}

export class PrinterFileDto<KeyType = IdType> extends IdDto<KeyType> {
  printerId: KeyType;

  name: string;
  date: number;
  display: string;
  gcodeAnalysis: GcodeAnalysisDto;

  hash: string;
  origin: string;
  path: string;
  prints: Prints;
  refs: Refs;
  size: number;
  statistics: Statistics;
  type: string;
  typePath: string[]; // machinecode gcode
}
