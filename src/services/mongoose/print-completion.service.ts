import { PrintCompletion } from "@/models";
import { createPrintCompletionSchema } from "../validators/print-completion-service.validation";
import { validateInput } from "@/handlers/validators";
import { EVENT_TYPES } from "../octoprint/constants/octoprint-websocket.constants";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { MongoIdType } from "@/shared.constants";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.interface";
import {
  CreatePrintCompletionDto,
  PrintCompletionContext,
  PrintCompletionDto,
} from "@/services/interfaces/print-completion.dto";
import { IPrintCompletion } from "@/models/PrintCompletion";
import { processCompletions } from "@/services/mongoose/print-completion.shared";

export class PrintCompletionService implements IPrintCompletionService<MongoIdType> {
  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(PrintCompletionService.name);
  }

  toDto(entity: IPrintCompletion): PrintCompletionDto<MongoIdType> {
    return {
      id: entity.id,
      completionLog: entity.completionLog,
      context: entity.context,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
      status: entity.status,
      printerId: entity.printerId.toString(),
    };
  }

  async create(input: CreatePrintCompletionDto<MongoIdType>) {
    const { printerId, fileName, completionLog, status, context } = await validateInput(
      input,
      createPrintCompletionSchema(false),
    );

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

  async findPrintCompletion(correlationId: string) {
    return PrintCompletion.find({
      "context.correlationId": correlationId,
    });
  }

  async updateContext(correlationId: string | undefined, context: PrintCompletionContext) {
    if (!correlationId?.length) {
      this.logger.warn("Ignoring undefined correlationId, cant update print completion context");
      return;
    }

    const completionEntry = await PrintCompletion.findOne({
      "context.correlationId": correlationId,
      status: EVENT_TYPES.PrintStarted,
    });

    if (!completionEntry) {
      this.logger.warn(
        `Print with correlationId ${correlationId} could not be updated with new context as it was not found`,
      );
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
      }),
    );
  }

  async listGroupByPrinterStatus() {
    const printCompletionsAggr = await PrintCompletion.aggregate([
      {
        $group: {
          _id: "$printerId",
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

    return processCompletions(printCompletionsAggr);
  }
}
