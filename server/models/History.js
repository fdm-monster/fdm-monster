const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    printerName: {
      type: String,
      required: true
    },
    printerId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    // Core job (contains duplicate data)
    job: {
      type: Object,
      required: true
    },
    // Async event or self-patched payload
    payload: {
      type: Object,
      required: true
    },
    // Any metadata necessary to identify this event further
    meta: {
      type: Object,
      required: true
    },
    // Identifying WebSocket message which concluded this print
    octoPrintEventType: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const History = mongoose.model("History", HistorySchema);

module.exports = History;
