const mongoose = require("mongoose");

const FilamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: false
  },
  cost: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  used: {
    type: Number,
    required: true
  },
  printTemperature: {
    type: Number,
    required: true
  },
  metaData: {
    type: Object,
    required: false
  }
});

const Filament = mongoose.model("Filament", FilamentSchema);
module.exports = Filament;
