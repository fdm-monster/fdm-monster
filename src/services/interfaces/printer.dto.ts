import { IdDto } from "@/shared.constants";
import { PrinterType } from "@/services/printer-api.interface";

export class CreatePrinterDto {
  name: string;
  apiKey: string;
  printerURL: string;
  printerType: PrinterType;
}

export class PrinterDto<KeyType> extends IdDto<KeyType> {
  name: string;
  enabled: boolean;
  disabledReason?: string;
  dateAdded: number;
  apiKey: string;
  printerURL: string;
  printerType: PrinterType;
}

export class TestPrinterDto<KeyType> extends PrinterDto<KeyType> {
  correlationToken: string;
}
