import { model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface IPrintLog<KeyType = MongoIdType, PrinterIdType = Schema.Types.ObjectId> {
  id: KeyType;
  fileName: string;
  createdAt: Date;
  endedAt: null | Date;
  status: string;
  printerId: PrinterIdType;
}

const PrintCompletionSchema = new Schema<IPrintLog>({
  fileName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  endedAt: {
    type: Date,
    default: null,
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
});

export const PrintCompletion = model("PrintCompletion", PrintCompletionSchema);
