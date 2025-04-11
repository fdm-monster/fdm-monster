import { IdType } from "@/shared.constants";
import { IPrinter } from "@/models/Printer";

export const socketIoConnectedEvent = "socketio.connected";

export const uploadProgressEvent = (token: string) => `upload.progress.${token}`;
export const uploadDoneEvent = (token: string) => `upload.done.${token}`;
export const uploadFailedEvent = (token: string) => `upload.failed.${token}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId: IdType) => `${prefix}.${printerId}.printer-stopped`;

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated"
};

export interface PrinterCreatedEvent<T = IdType> {
  printer: IPrinter<T>;
}

export interface PrinterUpdatedEvent<T = IdType> {
  printer: IPrinter<T>;
}

export interface BatchPrinterCreatedEvent<T = IdType> {
  printers: IPrinter<T>[];
}

export interface PrintersDeletedEvent<T = IdType> {
  printerIds: T[];
}
