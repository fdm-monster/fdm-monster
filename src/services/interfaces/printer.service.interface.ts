import { Printer } from "@/entities";

export interface IPrinterService<KeyType> {
  list(): Promise<Printer[]>;

  get(printerId: KeyType): Promise<Printer>;

  create(printer: Partial<Printer>, emitEvent: boolean): Promise<Printer>;

  update(printerId: KeyType, printer: Partial<Printer>): Promise<Printer>;

  delete(printerId: KeyType): Promise<any>;

  deleteMany(printerIds: KeyType[]): Promise<any | void>;

  batchImport(printers: Partial<Printer>[]): Promise<Printer[]>;

  updateConnectionSettings(printerId: KeyType, partial: { printerUrl: string; apiKey: string }): Promise<Printer>;

  updateEnabled(printerId: KeyType, enabled: boolean): Promise<Printer>;

  updateFeedRate(printerId: KeyType, feedRate: number): Promise<Printer>;

  updateFlowRate(printerId: KeyType, flowRate: number): Promise<Printer>;

  updateDisabledReason(printerId: KeyType, disabledReason: string): Promise<Printer>;
}
