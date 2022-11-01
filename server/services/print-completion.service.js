const PrintCompletionModel = require("../models/PrintCompletion");
const { createPrintCompletionRules } = require("./validators/print-completion-service.validation");
const { validateInput } = require("../handlers/validators");

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
    return PrintCompletionModel.aggregate([
      {
        $group: {
          _id: "$printerId",
          count: { $sum: 1 },
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
  }
}

module.exports = {
  PrintCompletionService,
};
