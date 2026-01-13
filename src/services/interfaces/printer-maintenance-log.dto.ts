export interface PrinterMaintenanceLogDto {
  id: number;
  createdAt: Date;
  createdBy: string;
  createdByUserId: number | null;
  printerId: number | null;
  printerName: string;
  printerUrl: string;
  metadata: {
    partsInvolved?: string[];
    cause?: string;
    notes?: string;
    completionNotes?: string;
  };
  completed: boolean;
  completedAt?: Date;
  completedByUserId: number | null;
  completedBy?: string;
}

export interface CreateMaintenanceLogDto {
  printerId: number;
  metadata: {
    partsInvolved?: string[];
    cause?: string;
    notes?: string;
  };
}

export interface CompleteMaintenanceLogDto {
  completionNotes?: string;
}

