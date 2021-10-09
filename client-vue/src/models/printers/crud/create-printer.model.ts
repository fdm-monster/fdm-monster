import { PrinterGroup } from "@/models/printers/printer-group.model";

export const defaultCreatePrinter: PreCreatePrinter = {
  printerName: "",
  printerHostPrefix: "http",
  printerHostPort: 80,
  websocketPrefix: "ws",
  printerHostName: "",
  sortIndex: 0,
  apiKey: "",
  display: true,
  enabled: true,
  groups: [],
  stepSize: 1
};

export type WebSocketProtocol = "ws" | "wss";
export type HttpProtocol = "http" | "https";

export interface PreCreatePrinter {
  enabled: boolean;
  display: boolean;
  sortIndex: number;
  printerName: string;

  websocketPrefix: WebSocketProtocol;
  printerHostPrefix: HttpProtocol;
  printerHostName: string;
  printerHostPort: number;

  apiKey: string;
  groups: PrinterGroup[];

  // Baby-stepping
  stepSize: 0.1 | 1 | 10 | 100;
}

export interface CreatePrinter {
  enabled: boolean;
  display: boolean;
  sortIndex: number;
  printerName: string;

  websocketURL: string;
  printerURL: string;

  apiKey: string;
  groups: PrinterGroup[];

  // Baby-stepping
  stepSize: 0.1 | 1 | 10 | 100;
}
