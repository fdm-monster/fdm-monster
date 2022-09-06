export interface PrinterFailedScanStateModel {
  id: string;
  printerName: string;
  error: string;
}

export interface PrinterFirmwareStateModel {
  id: string;
  printerName: string;
  firmware: string;
}

export interface PrinterFirmwareStateResponse {
  failed: PrinterFailedScanStateModel[];
  firmwareStates: PrinterFirmwareStateModel[];
}
