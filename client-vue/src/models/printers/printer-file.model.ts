import { GCodeAnalysis } from "@/models/printers/gcode/gcode-analysis.model";

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

export interface PrinterFile {
  date: number;
  display: string;
  gcodeAnalysis: GCodeAnalysis;
  hash: string;
  name: string;
  origin: string;
  path: string;
  prints: Prints;
  refs: Refs;
  size: number;
  statistics: Statistics;
  type: string;
  typePath: string[]; // machinecode gcode
}

export interface ClearedFilesResult {
  failedFiles: PrinterFile[];
  succeededFiles: PrinterFile[];
}
