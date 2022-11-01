const PrintCompletionModel = require("../models/PrintCompletion");
const { createPrintCompletionRules } = require("./validators/print-completion-service.validation");
const { validateInput } = require("../handlers/validators");
const { groupArrayBy } = require("../utils/array.util");

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
          printCompletionEvents: {
            $push: {
              printerId: "$printerId",
              context: "$context",
              completionLog: "$completionLog",
              status: "$status",
              createdAt: "$createdAt",
            },
          },
        },
      },
    ]);

    printCompletionsAggr.map((pc) => {
      pc.printJobs = groupArrayBy(pc.printCompletionEvents, (e) => e.context?.correlationId);
      pc.correlationIds = Object.keys(pc.printJobs);
      pc.printCount = pc.correlationIds?.length;
      return pc;
    });

    return printCompletionsAggr;
  }
}

module.exports = {
  PrintCompletionService,
};
