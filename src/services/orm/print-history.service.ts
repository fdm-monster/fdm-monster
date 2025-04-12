import { BaseService } from "@/services/orm/base.service";
import { PrintLog } from "@/entities";
import { CreatePrintHistoryDto, PrintHistoryDto } from "@/services/interfaces/print-history.dto";
import { SqliteIdType } from "@/shared.constants";
import { IPrintHistoryService } from "@/services/interfaces/print-history.interface";
import { In, Not } from "typeorm";
import { EVENT_TYPES } from "@/services/octoprint/constants/octoprint-websocket.constants";
import { groupArrayBy } from "@/utils/array.util";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";

export class PrintHistoryService
  extends BaseService(PrintLog, PrintHistoryDto<SqliteIdType>)
  implements IPrintHistoryService<SqliteIdType, PrintLog> {
  private readonly logger: LoggerService;

  constructor(typeormService: TypeormService, loggerFactory: ILoggerFactory) {
    super(typeormService);
    this.logger = loggerFactory(PrintHistoryService.name);
  }

  toDto(entity: PrintLog): PrintHistoryDto<SqliteIdType> {
    return {
      id: entity.id,
      fileName: entity.fileName,
      createdAt: entity.createdAt,
      endedAt: entity.endedAt,
      printerName: entity.printerName,
      status: entity.status,
      printerId: entity.printerId,
    };
  }

  async create(input: CreatePrintHistoryDto<SqliteIdType>) {
    return await super.create(input);
  }

  async loadPrintContexts(): Promise<Record<string, PrintLog[]>> {
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
