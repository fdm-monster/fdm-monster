import { PrinterGroupDto } from "@/services/interfaces/printer-group.dto";

export interface GroupDto<KeyType extends string | number = number> {
  id: KeyType;
  name: string;
}

export interface GroupWithPrintersDto<KeyType extends string | number = number> extends GroupDto<KeyType> {
  printers: PrinterGroupDto<KeyType>[];
}
