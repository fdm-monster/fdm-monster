import { IdType } from "@/shared.constants";

export interface PrintCompletionContext {
  correlationId: string;
}

export class CreatePrintCompletionDto<KeyType = IdType> {
  fileName: string;
  status: string;
  printerId: KeyType;
  printerReference?: string;
  completionLog: string;
  context: PrintCompletionContext;
}

export class PrintCompletionDto<KeyType = IdType> {
  id!: KeyType;
  fileName: string;
  createdAt: number;
  status: string;
  printerId: KeyType;
  printerReference?: string;
  completionLog: string;
  context: PrintCompletionContext;
}
