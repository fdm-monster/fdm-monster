const { Schema, model } = require("mongoose");

const CameraStreamSchema = new Schema({
  streamURL: {
    type: String,
    required: true,
  },
  printerId: {
    type: Schema.Types.ObjectId,
    ref: "Printer",
    required: false,
    unique: true,
  },
  settings: {
    type: {
      aspectRatio: {
        type: String,
        required: true,
        default: "16:9",
      },
      rotationClockwise: {
        type: Number,
        required: true,
        default: 0,
      },
      flipHorizontal: {
        type: Boolean,
        required: true,
        default: false,
      },
      flipVertical: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    required: true,
  },
});

module.exports = {
  CameraStream: model("CameraStream", CameraStreamSchema),
};
