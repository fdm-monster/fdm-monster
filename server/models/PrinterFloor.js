const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const PrinterGroupInFloorSchema = new Schema({
  printerGroupId: Schema.Types.ObjectId,
  // No metadata needed yet
  _id: false,
});

const PrinterFloorSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    unique: true,
    min: [0, "Floors must be numbered from 0 and up"],
    required: true,
  },
  printerGroups: {
    type: [PrinterGroupInFloorSchema],
    required: true,
  },
});

const PrinterFloor = mongoose.model("PrinterFloor", PrinterFloorSchema);

module.exports = PrinterFloor;
