const mongoose = require("mongoose");

const PrinterSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true // !
  },
  camURL: {
    type: String,
    required: false
  },
  printerURL: {
    type: String,
    required: true // !
  },
  webSocketURL: {
    type: String,
    required: true // !
  },
  sortIndex: {
    type: Number,
    required: true
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true
  },
  settingsAppearance: {
    // Not modeling this could be cause of .save() not working
    type: Object,
    required: true
  },
  // Auto-generated below
  currentUser: {
    type: String,
    required: false
  },
  dateAdded: {
    type: Number,
    required: false
  },
  // TODO move out
  fileList: {
    type: Object,
    required: false
  },
  // Non-essentials below
  powerSettings: {
    type: Object,
    required: false
  },
  costSettings: {
    type: Object,
    required: false
  },
  tempTriggers: {
    type: Object,
    required: false
  },
  feedRate: {
    type: Number,
    required: false
  },
  flowRate: {
    type: Number,
    required: false
  },
  selectedFilament: {
    type: Object,
    required: false
  },
  currentIdle: {
    type: Number,
    required: false
  },
  currentActive: {
    type: Number,
    required: false
  },
  currentOffline: {
    type: Number,
    required: false
  },
  // TODO move out
  group: {
    type: String,
    required: false
  },
  // TODO remove
  storage: {
    type: Object,
    required: false
  }
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
