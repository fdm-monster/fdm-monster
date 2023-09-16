const mongoose = require("mongoose");

const CustomGCodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  gcode: {
    type: Array,
    required: true,
  },
});

const CustomGCode = mongoose.model("CustomGCode", CustomGCodeSchema);

module.exports = CustomGCode;
