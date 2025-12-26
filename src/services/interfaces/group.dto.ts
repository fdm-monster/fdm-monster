import { PrinterGroupDto } from "@/services/interfaces/printer-group.dto";

export interface GroupDto {
  id: number;
  name: string;
}

export interface GroupWithPrintersDto extends GroupDto {
  printers: PrinterGroupDto[];
}
