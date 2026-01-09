import { PrinterType } from "@/services/printer-api.interface";

export class CreatePrinterDto {
  name: string;
  apiKey?: string;
  printerURL: string;
  printerType: PrinterType;
}

export class PrinterDto {
  id: number;
  name: string;
  enabled: boolean;
  disabledReason: string | null;
  dateAdded?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  printerURL: string;
  printerType: number;
}
