import { newRandomNamePair } from "@/constants/noun-adjectives.data";

export const getDefaultCreatePrinter = (): PreCreatePrinter => ({
  id: undefined,
  printerName: newRandomNamePair(),
  printerHostPrefix: "http",
  printerHostPort: 80,
  websocketPrefix: "ws",
  printerHostName: "",
  sortIndex: 0,
  apiKey: "",
  display: true,
  enabled: true,
  stepSize: 1
});

export type WebSocketProtocol = "ws" | "wss";
export type HttpProtocol = "http" | "https";

export interface PreCreatePrinter {
  id?: string; // Only in case of update

  enabled: boolean;
  display: boolean;
  sortIndex: number;
  printerName: string;

  websocketPrefix: WebSocketProtocol;
  printerHostPrefix: HttpProtocol;
  printerHostName: string;
  printerHostPort: number;

  apiKey: string;

  // Baby-stepping
  stepSize: 0.1 | 1 | 10 | 100;
}

export interface CreatePrinter {
  id?: string; // Only in case of update

  enabled: boolean;
  sortIndex: number;
  printerName: string;

  webSocketURL: string;
  printerURL: string;

  apiKey: string;

  // Baby-stepping
  stepSize: 0.1 | 1 | 10 | 100;
}
