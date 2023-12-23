import { IdType } from "@/shared.constants";
import { CreatePrintCompletionDto, PrintCompletionContext, PrintCompletionDto } from "@/services/interfaces/print-completion.dto";
import { IPrintCompletion } from "@/models/PrintCompletion";

export interface IPrintCompletionService<KeyType = IdType, Entity = IPrintCompletion> {
  toDto(printCompletion: Entity): PrintCompletionDto<KeyType>;

  create(input: CreatePrintCompletionDto<KeyType>): Promise<Entity>;

  list(): Promise<Entity[]>;

  findPrintCompletion(correlationId: string): Promise<Entity[]>;

  updateContext(correlationId: string, context: PrintCompletionContext): Promise<void>;

  loadPrintContexts(): Promise<Record<string, IPrintCompletion[]>>;

  listGroupByPrinterStatus(): Promise<any[]>;
}
