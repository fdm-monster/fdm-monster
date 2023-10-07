import { IPrinter } from "@/models/Printer";
import { IdType } from "@/shared.constants";

export interface IPrinterService<KeyType = IdType> {
  list(): Promise<IPrinter[]>;

  get(printerId: KeyType): Promise<IPrinter>;

  create(printer: Partial<IPrinter>, emitEvent: boolean): Promise<IPrinter>;

  update(printerId: KeyType, printer: Partial<IPrinter>): Promise<IPrinter>;

  delete(printerId: KeyType): Promise<any>;

  deleteMany(printerIds: KeyType[]): Promise<any | void>;

  batchImport(printers: Partial<IPrinter>[]): Promise<IPrinter[]>;

  updateConnectionSettings(printerId: KeyType, partial: { printerUrl: string; apiKey: string }): Promise<IPrinter>;

  updateEnabled(printerId: KeyType, enabled: boolean): Promise<IPrinter>;

  updateFeedRate(printerId: KeyType, feedRate: number): Promise<IPrinter>;

  updateFlowRate(printerId: KeyType, flowRate: number): Promise<IPrinter>;

  updateDisabledReason(printerId: KeyType, disabledReason: string): Promise<IPrinter>;
}
