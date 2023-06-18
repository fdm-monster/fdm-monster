const socketIoConnectedEvent = "socketio.connected";

const printerEvents = {
  printersDeleted: "printersDeleted",
  printerUpdated: "printerUpdated",
  printerCreated: "printerCreated",
  batchPrinterCreated: "batchPrinterCreated",
};

const octoPrintWebsocketEvent = (printerId) => `octoprint.${printerId}`;
const octoPrintWebsocketCurrentEvent = (printerId) => `octoprint.${printerId}.current`;
const uploadProgressEvent = (token) => `upload.progress.${token}`;
const firmwareFlashUploadEvent = (printerId) => `firmware-upload.${printerId}`;

const prefix = "fdm-monster";
const fdmMonsterPrinterStoppedEvent = (printerId) => `${prefix}.${printerId}.printer-stopped`;
const fdmPrinterEventToPrinterId = (event) => event.split(".")[1];

module.exports = {
  socketIoConnectedEvent,
  printerEvents,
  uploadProgressEvent,
  firmwareFlashUploadEvent,
  octoPrintWebsocketEvent,
  fdmMonsterPrinterStoppedEvent,
  octoPrintWebsocketCurrentEvent,
  fdmPrinterEventToPrinterId,
};
