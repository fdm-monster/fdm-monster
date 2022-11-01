export type PrintJobEvents = {
  printerId: string;
  context: {
    correlationId: string;
    events: {
      status: string;
      fileName: string;
      createdAt: number;
      printerId: string;
    }[]; // ... others
  };
};

export interface PrinterCompletions {
  _id: string;
  printCount: number;
  eventCount: number;
  successCount: number;
  failureCount: number;
  lastSuccess: any;
  printEvents: PrintJobEvents;
  printJobs: {
    [k: string]: PrintJobEvents;
  };

  correlationIds: any[];
}

export type PrintCompletionsModel = PrinterCompletions[];
