export interface PrinterAvailableObjects {
  objects: Object[];
}

export type Object = "gcode" | "toolhead" | "bed_mesh" | "configfile" | string;
