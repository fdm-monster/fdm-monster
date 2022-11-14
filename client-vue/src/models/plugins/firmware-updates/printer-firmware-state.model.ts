export interface PrinterFailedScanStateModel {
  id: string;
  printerName: string;
  error: string;
}

export interface PrinterFirmwareStateModel {
  id: string;
  printerName: string;
  pluginInstalled: boolean;
  firmware: string;
}

export interface PrinterInstalledResponse {
  isInstalled: boolean;
  installing: boolean;
}

export interface PrinterFirmwareStateResponse {
  failed: PrinterFailedScanStateModel[];
  firmwareStates: PrinterFirmwareStateModel[];
}
