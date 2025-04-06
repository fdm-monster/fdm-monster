import { IPrinter } from "@/models/Printer";
import { IdType } from "@/shared.constants";
import { PrinterDto, PrinterUnsafeDto } from "@/services/interfaces/printer.dto";
import { Printer } from "@/entities";

export interface IPrinterService<KeyType = IdType, Entity = IPrinter<KeyType>> {
  toDto(entity: Entity): PrinterDto<KeyType>;

  list(): Promise<Entity[]>;

  get(printerId: KeyType): Promise<Entity>;

  create(printer: Partial<Entity>, emitEvent?: boolean): Promise<Entity>;

  update(printerId: KeyType, printer: Partial<Entity>): Promise<Entity>;

  delete(printerId: KeyType, emitEvent?: boolean): Promise<any>;

  deleteMany(printerIds: KeyType[]): Promise<any | void>;

  batchImport(printers: Partial<Entity>[]): Promise<Entity[]>;

  updateEnabled(printerId: KeyType, enabled: boolean): Promise<Entity>;

  updateFeedRate(printerId: KeyType, feedRate: number): Promise<Entity>;

  updateFlowRate(printerId: KeyType, flowRate: number): Promise<Entity>;

  updateDisabledReason(printerId: KeyType, disabledReason: string): Promise<Entity>;
}
