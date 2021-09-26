export interface PrinterJob {
  fileName: string;
  fileDisplay: string;
  filePath: string;
  expectedPrintTime: number; // Rename
  averagePrintTime: number;
  lastPrintTime: number;

  currentZ?: number;
}

export interface PrinterCurrentJob extends PrinterJob {
  progress: number;
  printTimeRemaining: number; // Rename
  printTimeElapsed: number; // Rename
  expectedPrintTime: number; // Move to client?
  expectedCompletionDate: string;
}
