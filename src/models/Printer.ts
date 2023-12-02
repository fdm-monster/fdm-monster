import { model, Schema } from "mongoose";

export interface IPrinter {
  id: string;
  apiKey: string;
  printerURL: string;
  enabled: boolean;
  disabledReason: string;
  name: string;
  currentUser: string;
  dateAdded: number;
  lastPrintedFile: {
    fileName: string;
    editTimestamp: number;
    parsedColor: string;
    parsedVisualizationRAL: number;
    parsedAmount: number;
    parsedMaterial: string;
    parsedOrderCode: string;
  };
  fileList: [];
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
  // Deprecated, Will become many to many
  lastPrintedFile: {
    type: {
      fileName: {
        type: String,
        required: true,
      },
      editTimestamp: {
        type: Number,
        required: true,
      },
      parsedColor: {
        type: String,
        required: false,
      },
      parsedVisualizationRAL: {
        type: Number,
        required: false,
      },
      parsedAmount: {
        type: Number,
        required: false,
      },
      parsedMaterial: {
        type: String,
        required: false,
      },
      parsedOrderCode: {
        type: String,
        required: false,
      },
    },
    required: false,
  },
  // Deprecated in v1.5.0
  fileList: {
    type: Array,
    default: [],
    required: true,
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
