const PrintCompletionModel = require("../models/PrintCompletion");
const { createPrintCompletionRules } = require("./validators/print-completion-service.validation");
const { validateInput } = require("../handlers/validators");
const { groupArrayBy } = require("../utils/array.util");
const { EVENT_TYPES } = require("./octoprint/constants/octoprint-websocket.constants");

class PrintCompletionService {
  async create(input) {
    const { printerId, fileName, completionLog, status, context } = await validateInput(
      input,
      createPrintCompletionRules
    );

    return PrintCompletionModel.create({
      printerId,
      fileName,
      completionLog,
      status,
      createdAt: Date.now(),
      context,
    });
  }

  async list() {
    return PrintCompletionModel.find({});
  }

  async listGroupByPrinterStatus() {
    const printCompletionsAggr = await PrintCompletionModel.aggregate([
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

      const mappedEvents = pc.printEvents.map(
        ({ status, createdAt, fileName, context, completionLog }) => ({
          status,
          createdAt,
          fileName,
          context,
          completionLog,
        })
      );

      const failureEvents = mappedEvents.filter((e) => e.status === EVENT_TYPES.PrintFailed);
      pc.failureCount = failureEvents?.length;
      pc.lastFailure = failureEvents?.length
        ? failureEvents.reduce((j1, j2) => (j1.createdAt > j2.createdAt ? j1 : j2))
        : null;
      pc.failureEventsLastWeek = failureEvents.filter(
        (e) => e.createdAt > Date.now() - 7 * durationDayMSec
      )?.length;
      pc.failureEventsLast48H = failureEvents.filter(
        (e) => e.createdAt > Date.now() - 2 * durationDayMSec
      )?.length;
      pc.failureEventsLast24H = failureEvents.filter(
        (e) => e.createdAt > Date.now() - durationDayMSec
      )?.length;

      const successEvents = mappedEvents.filter((e) => e.status === EVENT_TYPES.PrintDone);
      pc.successCount = successEvents?.length;
      pc.lastSuccess = successEvents?.length
        ? successEvents?.reduce((j1, j2) => (j1.createdAt > j2.createdAt ? j1 : j2))
        : null;
      pc.successEventsLastWeek = successEvents.filter(
        (e) => e.createdAt > Date.now() - 7 * durationDayMSec
      )?.length;
      pc.successEventsLast48H = successEvents.filter(
        (e) => e.createdAt > Date.now() - 2 * durationDayMSec
      )?.length;
      pc.successEventsLast24H = successEvents.filter(
        (e) => e.createdAt > Date.now() - durationDayMSec
      )?.length;

      // Explodes in size quickly, remove the event timeline
      delete pc.printEvents;

      return pc;
    });
  }
}

module.exports = {
  PrintCompletionService,
};
