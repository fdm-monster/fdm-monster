import { PrinterDto } from "@/services/interfaces/printer.dto";
import { z } from "zod";
import { createPrinterSchema } from "@/services/validators/printer-service.validation";
import { Printer } from "@/entities";

export interface IPrinterService<KeyType = number, Entity = Printer> {
  toDto(entity: Entity): PrinterDto;

  list(): Promise<Entity[]>;

  get(printerId: KeyType): Promise<Entity>;

  create(printer: z.infer<typeof createPrinterSchema>, emitEvent?: boolean): Promise<Entity>;

  update(printerId: KeyType, printer: Partial<Entity>): Promise<Entity>;

  delete(printerId: KeyType, emitEvent?: boolean): Promise<void>;

  deleteMany(printerIds: KeyType[]): Promise<void>;

  batchImport(printers: Partial<Entity>[]): Promise<Entity[]>;

  updateEnabled(printerId: KeyType, enabled: boolean): Promise<Entity>;

  updateFeedRate(printerId: KeyType, feedRate?: number): Promise<Entity>;

  updateFlowRate(printerId: KeyType, flowRate?: number): Promise<Entity>;

  updateDisabledReason(printerId: KeyType, disabledReason?: string): Promise<Entity>;
}
