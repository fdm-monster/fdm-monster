import { model, Schema } from "mongoose";

export interface IPrintCompletion {
  fileName: string;
  createdAt: number;
  status: string;
  printerId: Schema.Types.ObjectId;
  completionLog: string;
  context: object;
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
