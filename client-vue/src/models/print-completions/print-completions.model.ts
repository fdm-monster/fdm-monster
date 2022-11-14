export interface ShortEvent {
  status: string;
  fileName: string;
  createdAt: number;
  completionLog?: string;
}

export interface ContextEvent extends ShortEvent {
  context?: {
    correlationId: string;
    [k: string]:
      | string
      | {
          status: string;
          createdAt: number;
          printerId: string;
        };
  };
}

export type PrintJobEvents = {
  correlationId: string;
  events: ShortEvent[]; // ... others
  lastEvent: ShortEvent;
};

export interface PrinterCompletions {
  _id: string;
  printCount: number;
  eventCount: number;
  successCount: number;
  failureCount: number;
  lastSuccess: ContextEvent;
  lastFailure: ContextEvent;
  failuresLastWeek: number;
  failuresLast48H: number;
  failuresLast24H: number;
  successesLastWeek: number;
  successesLast48H: number;
  successesLast24H: number;

  printJobs: PrintJobEvents[];

  correlationIds: string[];
}

export type PrintCompletionsModel = PrinterCompletions[];
