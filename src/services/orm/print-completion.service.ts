import { BaseService } from "@/services/orm/base.service";
import { PrintCompletion } from "@/entities";
import { CreatePrintCompletionDto, PrintCompletionContext, PrintCompletionDto } from "@/services/interfaces/print-completion.dto";
import { SqliteIdType } from "@/shared.constants";
import { IPrintCompletionService } from "@/services/interfaces/print-completion.service";
import { In, Not } from "typeorm";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { groupArrayBy } from "@/utils/array.util";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import { AnalyzedCompletions, processCompletions } from "@/services/print-completion.shared";

export class PrintCompletionService
  extends BaseService(PrintCompletion, PrintCompletionDto<SqliteIdType>)
  implements IPrintCompletionService<SqliteIdType, PrintCompletion>
{
  logger: LoggerService;

  constructor({ typeormService, loggerFactory }: { typeormService: TypeormService; loggerFactory: ILoggerFactory }) {
    super({ typeormService });
    this.logger = loggerFactory(PrintCompletionService.name);
  }

  toDto(entity: PrintCompletion): PrintCompletionDto<SqliteIdType> {
    return {
      id: entity.id,
      completionLog: entity.completionLog,
      correlationId: entity.correlationId,
      context: entity.context,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
      printerReference: entity.printerReference,
      status: entity.status,
      printerId: entity.printerId,
    };
  }

  async create(input: CreatePrintCompletionDto<SqliteIdType>) {
    return await super.create(input);
  }

  async findPrintCompletion(correlationId: string) {
    return this.repository.findBy({ correlationId });
  }

  async updateContext(correlationId: string, context: PrintCompletionContext): Promise<void> {
    const completionEntry = await this.repository.findOneBy({
      correlationId,
      status: EVENT_TYPES.PrintStarted,
    });
    if (!completionEntry) {
      this.logger.warn(`Print with correlationId ${correlationId} could not be updated with new context as it was not found`);
      return;
    }
    completionEntry.context = context;
    await this.update(completionEntry.id, completionEntry);
  }

  async listGroupByPrinterStatus(): Promise<AnalyzedCompletions[]> {
    const limitedCompletions = await this.listPaged();
    const printCompletionsAggr = groupArrayBy(limitedCompletions, (val) => val.printerId.toString());
    const completions = Object.entries(printCompletionsAggr).map(([pc, val]) => ({
      printerId: parseInt(pc),
      printEvents: val,
    }));
    return processCompletions(completions);
  }

  async loadPrintContexts(): Promise<Record<string, PrintCompletion[]>> {
    const completions = await this.repository.find({
      where: {
        status: Not(In([EVENT_TYPES.PrintDone, EVENT_TYPES.PrintFailed])),
      },
      order: {
        printerId: 1,
        createdAt: -1,
      },
    });

    return groupArrayBy(completions, (val) => val.id.toString());
  }
}
