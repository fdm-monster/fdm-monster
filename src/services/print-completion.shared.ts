import { groupArrayBy } from "@/utils/array.util";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { PrintCompletion } from "@/entities";
import { IdType } from "@/shared.constants";

const durationDayMSec = 24 * 60 * 60 * 1000;

export interface AnalyzedCompletions {
  _id?: IdType;
  printerId: IdType;
  printEvents: PrintCompletion[];
  printJobs?: any[];
  correlationIds: IdType[];
  eventCount: number;
  printCount: number;
  failureCount: number;
  lastFailure: Partial<PrintCompletion>;
  failureEventsLastWeek: number;
  failureEventsLast48H: number;
  failureEventsLast24H: number;
  successCount: number;
  lastSuccess: Partial<PrintCompletion>;
  successEventsLastWeek: number;
  successEventsLast48H: number;
  successEventsLast24H: number;
}

export function processCompletions(completions: AnalyzedCompletions[]): AnalyzedCompletions[] {
  return completions.map((pc) => {
    pc.printerId = pc.printerId ?? pc._id;
    delete pc._id;
    const jobs = groupArrayBy(pc.printEvents, (e) => e.context?.correlationId);
    pc.printJobs = Object.entries(jobs).map(([id, events]) => {
      const eventMap = events.map(({ status, createdAt, fileName, completionLog }) => ({
        status,
        createdAt,
        fileName, // if this changes across events then a bug occurred
        completionLog,
      }));
      return {
        correlationId: id,
        events: eventMap,
        lastEvent: eventMap.reduce((e1, e2) => (e1.createdAt > e2.createdAt ? e1 : e2)),
      };
    });
    pc.correlationIds = pc.printJobs.map((j) => j.correlationId);
    pc.printCount = pc.correlationIds?.length;
    pc.eventCount = pc.printEvents.length;

    const mappedEvents = pc.printEvents.map(({ status, createdAt, fileName, context, completionLog }) => ({
      status,
      createdAt,
      fileName,
      context,
      completionLog,
    }));

    const failureEvents = mappedEvents.filter((e) => e.status === EVENT_TYPES.PrintFailed);
    pc.failureCount = failureEvents?.length;
    pc.lastFailure = failureEvents?.length ? failureEvents.reduce((j1, j2) => (j1.createdAt > j2.createdAt ? j1 : j2)) : null;
    pc.failureEventsLastWeek = failureEvents.filter((e) => e.createdAt > Date.now() - 7 * durationDayMSec)?.length;
    pc.failureEventsLast48H = failureEvents.filter((e) => e.createdAt > Date.now() - 2 * durationDayMSec)?.length;
    pc.failureEventsLast24H = failureEvents.filter((e) => e.createdAt > Date.now() - durationDayMSec)?.length;

    const successEvents = mappedEvents.filter((e) => e.status === EVENT_TYPES.PrintDone);
    pc.successCount = successEvents?.length;
    pc.lastSuccess = successEvents?.length ? successEvents?.reduce((j1, j2) => (j1.createdAt > j2.createdAt ? j1 : j2)) : null;
    pc.successEventsLastWeek = successEvents.filter((e) => e.createdAt > Date.now() - 7 * durationDayMSec)?.length;
    pc.successEventsLast48H = successEvents.filter((e) => e.createdAt > Date.now() - 2 * durationDayMSec)?.length;
    pc.successEventsLast24H = successEvents.filter((e) => e.createdAt > Date.now() - durationDayMSec)?.length;

    // Explodes in size quickly, remove the event timeline
    delete pc.printEvents;

    return pc;
  });
}
