import { IdType } from "@/shared.constants";
import {
  CreatePrintCompletionDto,
  PrintCompletionContext,
  PrintCompletionDto,
} from "@/services/interfaces/print-completion.dto";
import { IPrintCompletion } from "@/models/PrintCompletion";
import { Schema } from "mongoose";

export interface IPrintCompletionService<KeyType extends IdType = IdType, Entity = IPrintCompletion<KeyType>> {
  toDto(printCompletion: Entity): PrintCompletionDto<KeyType>;

  create(input: CreatePrintCompletionDto<KeyType>): Promise<Entity>;

  list(): Promise<Entity[]>;

  findPrintCompletion(correlationId: string): Promise<Entity[]>;

  updateContext(correlationId: string | null | undefined, context: PrintCompletionContext): Promise<void>;

  loadPrintContexts(): Promise<Record<KeyType, IPrintCompletion<KeyType, number | Schema.Types.ObjectId>[]>>;

  listGroupByPrinterStatus(): Promise<any[]>;
}
