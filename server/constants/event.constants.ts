export const socketIoConnectedEvent = "socketio.connected";

export const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

export const octoPrintWebsocketEvent = (printerId) => `octoprint.${printerId}`;
export const octoPrintWebsocketCurrentEvent = (printerId) => `octoprint.${printerId}.current`;
export const uploadProgressEvent = (token) => `upload.progress.${token}`;
export const firmwareFlashUploadEvent = (printerId) => `firmware-upload.${printerId}`;

export const prefix = "fdm-monster";
export const fdmMonsterPrinterStoppedEvent = (printerId) => `${prefix}.${printerId}.printer-stopped`;
export const fdmPrinterEventToPrinterId = (event) => event.split(".")[1];
