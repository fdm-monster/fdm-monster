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
    // Not modeling properties is the cause of .save() not working
    type: {
      name: {
        type: String,
        required: false
      }
    },
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
  lastPrintedFile: {
    type: {
      fileName: {
        type: String,
        required: true
      },
      editTimestamp: {
        type: Number,
        required: true
      },
      parsedColor: {
        type: String,
        required: false
      },
      parsedAmount: {
        type: Number,
        required: false
      },
      parsedMaterial: {
        type: String,
        required: false
      },
      parsedOrderCode: {
        type: String,
        required: false
      }
    },
    required: false
  },
  // TODO move out and model better
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
