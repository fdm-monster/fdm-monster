import { model, Schema } from "mongoose";

export interface IPrinter {
  id: string;
  apiKey: string;
  printerURL: string;
  enabled: boolean;
  disabledReason: string;
  name: string;
  assignee: string;
  currentUser: string;
  dateAdded: number;
  feedRate: number;
  flowRate: number;
}

export const PrinterSchema = new Schema<IPrinter>({
  apiKey: {
    type: String,
    required: true, // !
  },
  printerURL: {
    type: String,
    required: true, // !
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  disabledReason: {
    type: String,
    required: false,
  },
  assignee: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  // Auto-generated below
  currentUser: {
    type: String,
    required: false,
  },
  dateAdded: {
    type: Number,
    required: false,
  },
  feedRate: {
    type: Number,
    required: false,
  },
  flowRate: {
    type: Number,
    required: false,
  },
});

export const Printer = model("Printer", PrinterSchema);
