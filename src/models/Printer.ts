import { model, Schema } from "mongoose";
import { OctoprintType } from "@/services/printer-api.interface";
import { MongoIdType } from "@/shared.constants";

export interface IPrinter<KeyType = MongoIdType> {
  id: KeyType;
  apiKey: string;
  printerURL: string;
  printerType: number;
  enabled: boolean;
  disabledReason?: string;
  name: string;
  assignee?: string;
  dateAdded: number;
  feedRate?: number;
  flowRate?: number;
}

export const PrinterSchema = new Schema<IPrinter>({
  apiKey: {
    type: String,
    default: "",
  },
  printerURL: {
    type: String,
    required: true, // !
  },
  printerType: {
    type: Number,
    required: true,
    default: OctoprintType,
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
