const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const PrinterGroupInFloorSchema = new Schema({
  printerGroupId: Schema.Types.ObjectId,
  // No metadata needed yet
  id: false
});

const PrinterFloorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    min: [0, "Floors must be numbered from 0 and up"],
    required: false
  },
  printerGroups: {
    type: [PrinterGroupInFloorSchema],
    required: true
  }
});

const PrinterFloor = mongoose.model("PrinterFloor", PrinterFloorSchema);

module.exports = PrinterFloor;
