export interface PrinterQueryEndstopsDto {
  x: EndstopState;
  y: EndstopState;
  z: EndstopState;
}

export type EndstopState = "TRIGGERED" | "open";
