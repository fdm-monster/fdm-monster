const { Schema } = require("mongoose");

const PrinterInFloorSchema = new Schema({
  printerId: {
    type: Schema.Types.ObjectId,
    ref: "Printer",
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  }, // No metadata needed yet
  _id: false,
});

module.exports = {
  PrinterInFloorSchema,
};
