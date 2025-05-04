import { IdDto } from "@/shared.constants";

export class CreatePrinterDto {
  name: string;
  apiKey?: string;
  printerURL: string;
  printerType: number;
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
