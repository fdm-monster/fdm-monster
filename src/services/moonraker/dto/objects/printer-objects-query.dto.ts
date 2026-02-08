import type { PrinterObjectDto } from "@/services/moonraker/dto/objects/printer-object.dto";

export interface PrinterObjectsQueryDto<T = PrinterObjectDto> {
  status: T;
  eventtime: number | null;
}
