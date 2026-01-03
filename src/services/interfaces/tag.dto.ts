import { PrinterTagDto } from "@/services/interfaces/printer-tag.dto";

export interface TagDto {
  id: number;
  name: string;
  color: string;
}

export interface TagWithPrintersDto extends TagDto {
  printers: PrinterTagDto[];
}
