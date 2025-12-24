import { IdType } from "@/shared.constants";
import {
  CreatePrintCompletionDto,
  PrintCompletionContext,
  PrintCompletionDto,
} from "@/services/interfaces/print-completion.dto";
import { PrintCompletion } from "@/entities";

export interface IPrintCompletionService<KeyType extends IdType = IdType, Entity = PrintCompletion> {
  toDto(printCompletion: Entity): PrintCompletionDto<KeyType>;

  create(input: CreatePrintCompletionDto<KeyType>): Promise<Entity>;

  list(): Promise<Entity[]>;

  findPrintCompletion(correlationId: string): Promise<Entity[]>;

  updateContext(correlationId: string | null | undefined, context: PrintCompletionContext): Promise<void>;

  loadPrintContexts(): Promise<Record<KeyType, Entity[]>>;

  listGroupByPrinterStatus(): Promise<any[]>;
}
