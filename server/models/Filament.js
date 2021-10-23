const mongoose = require("mongoose");

const FilamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // Nested as profile.id in OP response
  profileId: {
    type: String,
    required: true
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
  // temp_offset in OP response
  tempOffset: {
    type: Number,
    required: true
  },
  // id in OP response
  filamentId: {
    type: Number,
    required: true
  }
});

const Filament = mongoose.model("Filament", FilamentSchema);
module.exports = Filament;
