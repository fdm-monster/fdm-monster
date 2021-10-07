const mongoose = require("mongoose");

const TempHistorySchema = new mongoose.Schema(
  {
    currentTemp: {
      type: Object,
      required: true
    },
    printerId: {
      type: String,
      required: true
    }
  },
  { capped: true, size: 10000, max: 1000000 }
);

const TempHistory = mongoose.model("TempHistory", TempHistorySchema);

module.exports = TempHistory;
