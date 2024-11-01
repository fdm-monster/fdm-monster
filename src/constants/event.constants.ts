import { IdType } from "@/shared.constants";

export const socketIoConnectedEvent = "socketio.connected";

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

export const octoPrintWebsocketEvent = (printerId: IdType) => `octoprint.${printerId}`;
export const octoPrintWebsocketCurrentEvent = (printerId: IdType) => `octoprint.${printerId}.current`;
export const uploadProgressEvent = (token: string) => `upload.progress.${token}`;
export const firmwareFlashUploadEvent = (printerId: IdType) => `firmware-upload.${printerId}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId: IdType) => `${prefix}.${printerId}.printer-stopped`;
export const fdmPrinterEventToPrinterId = (event: string) => event.split(".")[1];
