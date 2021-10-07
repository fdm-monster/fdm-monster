import { PrinterGroup } from "@/models/printers/printer-group.model";

export const defaultCreatePrinter: CreatePrinter = {
  apiKey: "",
  display: true,
  enabled: false,
  groups: [],
  printerName: "",
  printerURL: "",
  sortIndex: 0,
  stepSize: 1,
  webSocketURL: ""
};

export interface CreatePrinter {
  enabled: boolean;
  display: boolean;
  sortIndex: number;
  printerName: string;
  webSocketURL: string;
  apiKey: string;
  printerURL: string;
  groups: PrinterGroup[];

  // Baby-stepping
  stepSize: 0.1 | 1 | 10 | 100;
}
