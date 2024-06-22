import { PrinterObject } from "@/services/moonraker/dto/objects/printer-objects-list.dto";

export type PrinterObjectDto<K extends PrinterObject = PrinterObject, T = any> = {
  [k in K]: T;
};
