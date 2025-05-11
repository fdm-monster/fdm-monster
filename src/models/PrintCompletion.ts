import { model, Schema } from "mongoose";
import { PrintCompletionContextDto } from "@/services/interfaces/print-completion-context.dto";
import { MongoIdType } from "@/shared.constants";

export interface IPrintCompletion<KeyType = MongoIdType, PrinterIdType = Schema.Types.ObjectId> {
  id: KeyType;
  fileName: string;
  createdAt: number;
  status: string;
  printerId: PrinterIdType;
  completionLog?: string;
  context: PrintCompletionContextDto;
}

const PrintCompletionSchema = new Schema<IPrintCompletion>({
  fileName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  printerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  completionLog: {
    type: String,
    required: false,
  },
  context: {
    type: Object,
    required: true,
  },
});

export const PrintCompletion = model("PrintCompletion", PrintCompletionSchema);
