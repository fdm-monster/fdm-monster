import { PrintCompletion } from "@/models";
import { createPrintCompletionRules } from "./validators/print-completion-service.validation";
import { validateInput } from "@/handlers/validators";
import { groupArrayBy } from "@/utils/array.util";
import { EVENT_TYPES } from "./octoprint/constants/octoprint-websocket.constants";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";

export class PrintCompletionService {
  logger: LoggerService;

  constructor({ loggerFactory }: { loggerFactory: ILoggerFactory }) {
    this.logger = loggerFactory(PrintCompletionService.name);
  }

  async create(input) {
    const { printerId, fileName, completionLog, status, context } = await validateInput(input, createPrintCompletionRules);

    return PrintCompletion.create({
      printerId,
      fileName,
      completionLog,
      status,
      createdAt: Date.now(),
      context,
    });
  }

  async list() {
    return PrintCompletion.find({});
  }

  async findPrintCompletion(correlationId) {
    return PrintCompletion.find({
      "context.correlationId": correlationId,
    });
  }

  async updateContext(correlationId, context) {
    const completionEntry = await PrintCompletion.findOne({
      "context.correlationId": correlationId,
      status: EVENT_TYPES.PrintStarted,
    });

    if (!completionEntry) {
      this.logger.warn(`Print with correlationId ${correlationId} could not be updated with new context as it was not found`);
      return;
    }
    completionEntry.context = context;
    await completionEntry.save();
  }

  async loadPrintContexts() {
    const contexts = await PrintCompletion.aggregate([
      { $sort: { printerId: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$printerId",
          createdAt: { $first: "$createdAt" },
          context: { $first: "$context" },
          status: { $first: "$status" },
          fileName: { $first: "$fileName" },
        },
      },
      {
        $match: {
          status: {
            $nin: [EVENT_TYPES.PrintDone, EVENT_TYPES.PrintFailed],
          },
        },
      },
    ]);

    return Object.fromEntries(
      contexts.map((c) => {
        c.printerId = c._id;
        delete c._id;
        return [c.printerId, c];
      })
    );
  }

  async listGroupByPrinterStatus() {
    const printCompletionsAggr = await PrintCompletion.aggregate([
      {
        $group: {
          _id: "$printerId",
          eventCount: { $sum: 1 },
          printEvents: {
            $push: {
              printerId: "$printerId",
              context: "$context",
              completionLog: "$completionLog",
              fileName: "$fileName",
              status: "$status",
              createdAt: "$createdAt",
            },
          },
        },
      },
    ]);

    const durationDayMSec = 24 * 60 * 60 * 1000;

    return printCompletionsAggr.map((pc) => {
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
}
