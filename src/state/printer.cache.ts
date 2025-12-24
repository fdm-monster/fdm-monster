import { KeyDiffCache, keyType } from "@/utils/cache/key-diff.cache";
import {
  BatchPrinterCreatedEvent,
  PrinterCreatedEvent,
  printerEvents,
  PrintersDeletedEvent,
} from "@/constants/event.constants";
import { NotFoundException } from "@/exceptions/runtime.exceptions";
import EventEmitter2 from "eventemitter2";
import { IdType } from "@/shared.constants";
import { IPrinterService } from "@/services/interfaces/printer.service.interface";
import { PrinterDto } from "@/services/interfaces/printer.dto";
import { Printer } from "@/entities";

export class PrinterCache extends KeyDiffCache<PrinterDto<IdType>> {
  constructor(
    private readonly printerService: IPrinterService,
    private readonly eventEmitter2: EventEmitter2,
  ) {
    super();

    this.eventEmitter2.on(printerEvents.batchPrinterCreated, this.handleBatchPrinterCreated.bind(this));
    this.eventEmitter2.on(printerEvents.printerCreated, this.handlePrinterCreatedOrUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.printerUpdated, this.handlePrinterCreatedOrUpdated.bind(this));
    this.eventEmitter2.on(printerEvents.printersDeleted, this.handlePrintersDeleted.bind(this));
  }

  async loadCache(): Promise<PrinterDto<IdType>[]> {
    const printerDocs = await this.printerService.list();
    const dtos = this.mapArray(printerDocs);
    const keyValues = dtos.map((p) => ({ key: this.getId(p), value: p }));
    await this.setKeyValuesBatch(keyValues, true);
    return dtos;
  }

  async listCachedPrinters(includeDisabled = false): Promise<PrinterDto<IdType>[]> {
    const printers = await this.getAllValues();
    if (!includeDisabled) {
      return printers.filter((p) => p.enabled);
    }
    return printers;
  }

  async getCachedPrinterOrThrowAsync(id: keyType): Promise<PrinterDto<IdType>> {
    const printer = await this.getValue(id);
    if (!printer) {
      throw new NotFoundException(`Printer with provided id not found`);
    }
    return printer;
  }

  getCachedPrinterOrThrow(id: keyType) {
    const printer = this.keyValueStore[id];
    if (!printer) {
      throw new NotFoundException(`Printer with provided id not found`);
    }
    return printer;
  }

  async getNameAsync(id: keyType) {
    const printer = await this.getCachedPrinterOrThrowAsync(id);
    return printer.name;
  }

  getName(id: keyType) {
    const printer = this.getCachedPrinterOrThrow(id);
    return printer.name;
  }

  async getLoginDtoAsync(id: keyType) {
    const printer = await this.getCachedPrinterOrThrowAsync(id);
    return {
      printerURL: printer.printerURL,
      apiKey: printer.apiKey,
      username: printer.username,
      password: printer.password,
      printerType: printer.printerType,
    };
  }

  getLoginDto(id: keyType) {
    const printer = this.getCachedPrinterOrThrow(id);
    return {
      printerURL: printer.printerURL,
      apiKey: printer.apiKey,
      printerType: printer.printerType,
      username: printer.username,
      password: printer.password,
    };
  }

  private async handleBatchPrinterCreated(event: BatchPrinterCreatedEvent) {
    const mappedPrinters = this.mapArray(event.printers);
    const keyValues = mappedPrinters.map((p) => ({ key: this.getId(p), value: p }));
    await this.setKeyValuesBatch(keyValues, true);
  }

  private async handlePrinterCreatedOrUpdated(event: PrinterCreatedEvent) {
    const printerDto = this.map(event.printer);
    await this.setKeyValue(printerDto.id, printerDto, true);
  }

  private async handlePrintersDeleted(event: PrintersDeletedEvent) {
    await this.deleteKeysBatch(event.printerIds, true);
  }

  private getId(value: Printer) {
    return value.id.toString();
  }

  private mapArray(entities: Printer[]) {
    return entities.map((p) => {
      return this.map(p);
    });
  }

  private map(entity: Printer): PrinterDto<IdType> {
    return this.printerService.toDto(entity);
  }
}
