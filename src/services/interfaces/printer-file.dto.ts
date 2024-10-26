import { GcodeAnalysisDto } from "@/services/interfaces/gcode-analysis.dto";
import { IdDto, IdType } from "@/shared.constants";
import { OctoPrintCustomDto } from "@/services/octoprint/dto/files/octoprint-file.dto";

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

export class CreateOrUpdatePrinterFileDto<KeyType = IdType> {
  printerId?: KeyType;

  name: string;
  date: number;
  // display: string;
  // gcodeAnalysis?: GcodeAnalysisDto;

  // hash: string;
  // origin: string;
  path: string;
  // prints: Prints;
  // refs: Refs;
  size: number;
  // statistics: OctoPrintStatisticsDto;
  // type: string;
  // typePath: string[]; // machinecode gcode
  //
  // customData?: OctoPrintCustomDto;
}

export class PrinterFileDto<KeyType = IdType> extends IdDto<KeyType> {
  printerId: KeyType;

  name: string;
  date: number;
  // display: string;
  // gcodeAnalysis?: GcodeAnalysisDto;

  // hash: string;
  // origin: string;
  path: string;
  // prints: Prints;
  // refs: Refs;
  size: number;
  // statistics: OctoPrintStatisticsDto;
  // type: string;
  // typePath: string[]; // machinecode gcode
  //
  // customData?: OctoPrintCustomDto;
}
