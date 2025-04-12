import { PrintCompletion } from "@/models";
import { createPrintCompletionSchema } from "../validators/print-completion-service.validation";
import { validateInput } from "@/handlers/validators";
import { LoggerService } from "@/handlers/logger";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { MongoIdType } from "@/shared.constants";
import { IPrintHistoryService } from "@/services/interfaces/print-history.interface";
import { CreatePrintHistoryDto, PrintHistoryDto } from "@/services/interfaces/print-history.dto";
import { IPrintLog } from "@/models/PrintCompletion";

export class PrintCompletionService implements IPrintHistoryService<MongoIdType> {
  private readonly logger: LoggerService;

  constructor(loggerFactory: ILoggerFactory) {
    this.logger = loggerFactory(PrintCompletionService.name);
  }

  toDto(entity: IPrintLog): PrintHistoryDto<MongoIdType> {
    return {
      id: entity.id,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
      endedAt: entity.endedAt,
      status: entity.status,
      printerId: entity.printerId.toString(),
    };
  }

  async create(input: CreatePrintHistoryDto<MongoIdType>) {
    const {
      printerId,
      fileName,
      completionLog,
      status,
      context,
    } = await validateInput(input, createPrintCompletionSchema(false));

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
}
