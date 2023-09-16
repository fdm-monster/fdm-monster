const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { PrinterInFloorSchema } = require("./FloorPrinter");

const FloorSchema = new Schema({
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
  printers: [PrinterInFloorSchema],
});

const Floor = mongoose.model("Floor", FloorSchema);

module.exports = {
  Floor,
};
