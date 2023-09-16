import { model, Schema } from "mongoose";

const PrintCompletionSchema = new Schema({
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
