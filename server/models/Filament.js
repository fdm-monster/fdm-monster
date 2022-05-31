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
  consumedRatio: {
    type: Number,
    required: true
  },
  printTemperature: {
    type: Number,
    required: true
  },
  meta: {
    type: Object,
    required: false
  }
});

const Filament = mongoose.model("Filament", FilamentSchema);
module.exports = Filament;
