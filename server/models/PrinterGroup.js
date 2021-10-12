const mongoose = require("mongoose");
const Schema = require("mongoose/lib/schema");
const { arrayValidator } = require("../handlers/validators");

const PrinterGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    required: true,
    default: { x: 0, y: 0 },
    x: {
      type: Number,
      required: false
    },
    y: {
      type: Number,
      required: false
    }
  },
  printers: {
    type: [
      {
        type: Schema.Types.ObjectId,
        required: true
      }
    ],
    validate: [arrayValidator(0), "{PATH} not of length >=0."]
  }
});

const PrinterGroup = mongoose.model("PrinterGroup", PrinterGroupSchema);

module.exports = PrinterGroup;
