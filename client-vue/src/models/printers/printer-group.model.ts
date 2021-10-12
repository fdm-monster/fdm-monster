export interface PrinterInGroup {
  printerId: string;
  location: string;
}

export interface PrinterGroup {
  _id?: string;
  name: string;
  location: { x: number; y: number };
  printers: PrinterInGroup[];
}
