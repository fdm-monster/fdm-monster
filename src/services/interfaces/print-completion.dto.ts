export interface PrintCompletionContext {
  correlationId: string | null | undefined;
}

export class CreatePrintCompletionDto {
  fileName: string;
  status: string;
  printerId: number;
  printerReference?: string;
  completionLog?: string;
  context: PrintCompletionContext;
}

export class PrintCompletionDto {
  id!: number;
  fileName: string;
  createdAt: number;
  status: string;
  printerId: number;
  printerReference?: string;
  completionLog?: string;
  context: PrintCompletionContext;
}
