import {
  CreatePrintCompletionDto,
  PrintCompletionContext,
  PrintCompletionDto,
} from "@/services/interfaces/print-completion.dto";
import { PrintCompletion } from "@/entities";

export interface IPrintCompletionService<Entity = PrintCompletion> {
  toDto(printCompletion: Entity): PrintCompletionDto;

  create(input: CreatePrintCompletionDto): Promise<Entity>;

  list(): Promise<Entity[]>;

  findPrintCompletion(correlationId: string): Promise<Entity[]>;

  updateContext(correlationId: string | null | undefined, context: PrintCompletionContext): Promise<void>;

  loadPrintContexts(): Promise<Record<number, Entity[]>>;

  listGroupByPrinterStatus(): Promise<any[]>;
}
