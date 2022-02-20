const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const HistorySchema = new mongoose.Schema({
  notes: {
    type: String,
    required: false
  },
  printerName: {
    type: String,
    required: true
  },
  printerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  costSettings: {
    type: Object,
    required: true
  },
  // Core job (contains duplicate data)
  job: {
    type: Object,
    required: true
  },
  // Event payload
  success: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  printTime: {
    type: Number,
    required: true
  },
  // Event file references
  fileName: {
    type: String,
    required: true
  },
  fileDisplay: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  }
});

const History = mongoose.model("History", HistorySchema);

module.exports = History;
