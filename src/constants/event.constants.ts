import { Printer } from "@/entities";

export const socketIoConnectedEvent = "socketio.connected";

export const uploadProgressEvent = (token: string) => `upload.progress.${token}`;
export const uploadDoneEvent = (token: string) => `upload.done.${token}`;
export const uploadFailedEvent = (token: string) => `upload.failed.${token}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId: number) => `${prefix}.${printerId}.printer-stopped`;

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

export interface PrinterCreatedEvent {
  printer: Printer;
}

export interface PrinterUpdatedEvent {
  printer: Printer;
}

export interface BatchPrinterCreatedEvent {
  printers: Printer[];
}

export interface PrintersDeletedEvent {
  printerIds: number[];
}
