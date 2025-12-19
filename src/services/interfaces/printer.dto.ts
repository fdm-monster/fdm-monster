import { IdDto } from "@/shared.constants";
import { PrinterType } from "@/services/printer-api.interface";

export class CreatePrinterDto {
  name: string;
  apiKey?: string;
  printerURL: string;
  printerType: PrinterType;
}

export class PrinterDto<KeyType> extends IdDto<KeyType> {
  name: string;
  enabled: boolean;
  disabledReason?: string;
  dateAdded?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  printerURL: string;
  printerType: number;
}
