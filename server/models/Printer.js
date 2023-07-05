const { Schema, model } = require("mongoose");

const PrinterSchema = new Schema({
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
  settingsAppearance: {
    // Not modeling properties is the cause of .save() not working
    type: {
      name: {
        type: String,
        required: false,
      },
    },
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
    type: Object,
    default: {
      files: [],
      folders: [],
      free: 0,
      total: 0,
    },
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

const Printer = model("Printer", PrinterSchema);

module.exports = {
  Printer,
  PrinterSchema,
};
