import { IdDto } from "@/shared.constants";

export class CreatePrinterDto {
  name: string;
  apiKey: string;
  printerURL: string;
  printerType: number;
}

export class PrinterDto<KeyType> extends IdDto<KeyType> {
  name: string;
  enabled: boolean;
  disabledReason?: string;
  dateAdded: number;
  apiKey: string;
  printerURL: string;
  printerType: number;
}

export class TestPrinterDto<KeyType> extends PrinterDto<KeyType> {
  correlationToken: string;
}
