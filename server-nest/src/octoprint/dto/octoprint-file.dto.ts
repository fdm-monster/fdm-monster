import { AutoMap } from "@automapper/classes";

export class OctoPrintFileDto {
  @AutoMap()
  date: number;

  @AutoMap()
  display: string;
  @AutoMap()
  hash: string;
  @AutoMap()
  name: string;
  @AutoMap()
  origin: "local" | "sd";
  @AutoMap()
  path: string;
  @AutoMap()
  prints: {
    failure: number;
    success: number;
    last: {
      date: number;
      printTime: number;
      success: boolean;
    };
  };
  @AutoMap()
  refs: {
    download: string;
    resource: string;
  };
  @AutoMap()
  size: number;
  @AutoMap()
  statistics: {
    averagePrintTime: {
      _default: number;
    };
    lastPrintTime: {
      _default: number;
    };
  };
  @AutoMap()
  type: "machinecode";
  @AutoMap()
  typePath: ["machinecode", "gcode"];
}
