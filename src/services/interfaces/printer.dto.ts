import { IdDto } from "@/shared.constants";

export class PrinterDto<KeyType> extends IdDto<KeyType> {
  name: string;
  enabled: boolean;
  disabledReason: string;
  dateAdded: number;
}

export class PrinterUnsafeDto<KeyType> extends PrinterDto<KeyType> {
  apiKey: string;
  printerURL: string;
  printerType: number;
}

export class PrinterUnsafeWithCorrelationDto<KeyType> extends PrinterUnsafeDto<KeyType> {
  correlationToken: string;
}
