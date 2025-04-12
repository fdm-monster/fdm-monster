import { IdType } from "@/shared.constants";
import { PrintHistoryDto } from "@/services/interfaces/print-history.dto";

const durationDayMSec = 24 * 60 * 60 * 1000;

export interface ShortEvent {
  status: string;
  fileName: string;
  createdAt: number;
  completionLog?: string;
}

export type PrintJobEvents = {
  correlationId: string;
  events: ShortEvent[]; // ... others
  lastEvent: ShortEvent;
};

export interface AnalyzedCompletions {
  _id?: IdType;
  printerId: IdType;

  printEvents: PrintHistoryDto[];

  printJobs?: PrintJobEvents[];
}
