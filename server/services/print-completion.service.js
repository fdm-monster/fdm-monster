const PrintCompletionModel = require("../models/PrintCompletion");
const { createPrintCompletionRules } = require("./validators/print-completion-service.validation");
const { validateInput } = require("../handlers/validators");

class PrintCompletionService {
  async create(input) {
    const { printerId, fileName, completionLog, status } = await validateInput(
      input,
      createPrintCompletionRules
    );

    return PrintCompletionModel.create({
      printerId,
      fileName,
      completionLog,
      status,
      createdAt: Date.now(),
    });
  }

  async list() {
    return PrintCompletionModel.find({});
  }

  async listGroupByPrinterStatus() {
    return PrintCompletionModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = {
  PrintCompletionService,
};
