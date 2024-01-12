export const socketIoConnectedEvent = "socketio.connected";

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

export const octoPrintWebsocketEvent = (printerId: string) => `octoprint.${printerId}`;
export const octoPrintWebsocketCurrentEvent = (printerId: string) => `octoprint.${printerId}.current`;
export const uploadProgressEvent = (token: string) => `upload.progress.${token}`;
export const firmwareFlashUploadEvent = (printerId: string) => `firmware-upload.${printerId}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId: string) => `${prefix}.${printerId}.printer-stopped`;
export const fdmPrinterEventToPrinterId = (event: string) => event.split(".")[1];
