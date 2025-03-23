import { IdType } from "@/shared.constants";

export const socketIoConnectedEvent = "socketio.connected";

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

export const octoPrintWebsocketEvent = (printerId: IdType) => `octoprint.${printerId}`;
export const uploadProgressEvent = (token: string) => `upload.progress.${token}`;
export const uploadDoneEvent = (token: string) => `upload.done.${token}`;
export const uploadFailedEvent = (token: string) => `upload.failed.${token}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId: IdType) => `${prefix}.${printerId}.printer-stopped`;
