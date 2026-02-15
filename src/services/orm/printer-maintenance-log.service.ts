import { Repository } from "typeorm";
import { PrinterMaintenanceLog } from "@/entities/printer-maintenance-log.entity";
import { TypeormService } from "@/services/typeorm/typeorm.service";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import { LoggerService } from "@/handlers/logger";
import {
  CreateMaintenanceLogDto,
  PrinterMaintenanceLogDto,
  CompleteMaintenanceLogDto,
} from "@/services/interfaces/printer-maintenance-log.dto";
import { BadRequestException, NotFoundException } from "@/exceptions/runtime.exceptions";
import type { IPrinterService } from "@/services/interfaces/printer.service.interface";

export class PrinterMaintenanceLogService {
  private readonly logger: LoggerService;
  private readonly repository: Repository<PrinterMaintenanceLog>;

  constructor(
    loggerFactory: ILoggerFactory,
    typeormService: TypeormService,
    private readonly printerService: IPrinterService,
  ) {
    this.logger = loggerFactory(PrinterMaintenanceLogService.name);
    this.repository = typeormService.getDataSource().getRepository(PrinterMaintenanceLog);
  }

  toDto(entity: PrinterMaintenanceLog): PrinterMaintenanceLogDto {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      createdBy: entity.createdBy,
      createdByUserId: entity.createdByUserId,
      printerId: entity.printerId,
      printerName: entity.printerName,
      printerUrl: entity.printerUrl,
      metadata: entity.metadata,
      completed: entity.completed,
      completedAt: entity.completedAt,
      completedByUserId: entity.completedByUserId,
      completedBy: entity.completedBy,
    };
  }

  async create(dto: CreateMaintenanceLogDto, userId: number | null, username: string): Promise<PrinterMaintenanceLog> {
    // Get printer details
    const printer = await this.printerService.get(dto.printerId);

    // Check if there's already an active maintenance log for this printer
    const existingLog = await this.repository.findOne({
      where: {
        printerId: dto.printerId,
        completed: false,
      },
    });

    if (existingLog) {
      throw new BadRequestException(`Printer ${printer.name} already has an active maintenance log`);
    }

    const log = this.repository.create({
      printerId: dto.printerId,
      printerName: printer.name,
      printerUrl: printer.printerURL,
      metadata: dto.metadata,
      createdBy: username,
      createdByUserId: userId,
      completed: false,
    });

    await this.repository.save(log);

    // Update printer disabled reason for backwards compatibility
    await this.printerService.updateDisabledReason(dto.printerId, this.buildDisabledReasonFromMetadata(dto.metadata));

    return log;
  }

  async complete(
    logId: number,
    dto: CompleteMaintenanceLogDto,
    userId: number | null,
    username: string,
  ): Promise<PrinterMaintenanceLog> {
    const log = await this.repository.findOne({ where: { id: logId } });

    if (!log) {
      throw new NotFoundException(`Maintenance log with id ${logId} not found`);
    }

    if (log.completed) {
      throw new BadRequestException(`Maintenance log ${logId} is already completed`);
    }

    // Update metadata with completion notes
    log.metadata = {
      ...log.metadata,
      completionNotes: dto.completionNotes,
    };

    log.completed = true;
    log.completedAt = new Date();
    log.completedBy = username;
    log.completedByUserId = userId;

    await this.repository.save(log);

    // Clear printer disabled reason
    if (log.printerId) {
      await this.printerService.updateDisabledReason(log.printerId, null);
    }

    return log;
  }

  async get(logId: number): Promise<PrinterMaintenanceLog> {
    const log = await this.repository.findOne({ where: { id: logId } });

    if (!log) {
      throw new NotFoundException(`Maintenance log with id ${logId} not found`);
    }

    return log;
  }

  async getActiveByPrinterId(printerId: number): Promise<PrinterMaintenanceLog | null> {
    return this.repository.findOne({
      where: {
        printerId,
        completed: false,
      },
    });
  }

  async list(filters: {
    printerId?: number;
    completed?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: PrinterMaintenanceLog[]; total: number }> {
    const { printerId, completed, page = 1, pageSize = 20 } = filters;

    const queryBuilder = this.repository.createQueryBuilder("log");

    if (printerId !== undefined) {
      queryBuilder.andWhere("log.printerId = :printerId", { printerId });
    }

    if (completed !== undefined) {
      queryBuilder.andWhere("log.completed = :completed", { completed });
    }

    queryBuilder.orderBy("log.createdAt", "DESC");
    queryBuilder.skip((page - 1) * pageSize);
    queryBuilder.take(pageSize);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }

  async delete(logId: number): Promise<void> {
    const log = await this.get(logId);

    // Clear printer disabled reason if log is active
    if (!log.completed && log.printerId) {
      await this.printerService.updateDisabledReason(log.printerId, null);
    }

    await this.repository.delete(logId);
  }

  private buildDisabledReasonFromMetadata(metadata: {
    cause?: string;
    notes?: string;
    partsInvolved?: string[];
  }): string {
    const parts: string[] = [];

    if (metadata.cause) {
      parts.push(metadata.cause);
    }

    if (metadata.partsInvolved && metadata.partsInvolved.length > 0) {
      parts.push(`Parts: ${metadata.partsInvolved.join(", ")}`);
    }

    if (metadata.notes) {
      parts.push(metadata.notes);
    }

    return parts.join(" - ") || "Under maintenance";
  }
}
