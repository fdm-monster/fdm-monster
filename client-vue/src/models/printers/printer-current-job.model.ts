export interface PrinterJob {
  fileName: string;
  fileDisplay: string;
  filePath: string;
  averagePrintTime: number;
  lastPrintTime: number;
  estimatedPrintTime: number;

  currentZ?: number;
}

export interface PrinterCurrentJob extends PrinterJob {
  progress: number;
  printTimeLeft: number; // Rename
  printTimeElapsed: number; // Rename
}
