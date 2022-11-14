// This is still work in progress
const PEVENTS = {
  init: "init",
  current: "current",
  event: "event",
  reauth: "reauth",
  plugin: "plugin",
};

const octoPrintWebsocketEvent = (printerId) => `octoprint.${printerId}`;
const octoPrintWebsocketCurrentEvent = (printerId) => `octoprint.${printerId}.current`;
const uploadProgressEvent = (token) => `upload.progress.${token}`;
const firmwareFlashUploadEvent = (printerId) => `firmware-upload.${printerId}`;

const prefix = "fdm-monster";
const fdmMonsterPrinterStoppedEvent = (printerId) => `${prefix}.${printerId}.printer-stopped`;
const fdmPrinterEventToPrinterId = (event) => event.split(".")[1];

module.exports = {
  PEVENTS,
  uploadProgressEvent,
  firmwareFlashUploadEvent,
  octoPrintWebsocketEvent,
  fdmMonsterPrinterStoppedEvent,
  octoPrintWebsocketCurrentEvent,
  fdmPrinterEventToPrinterId,
};
