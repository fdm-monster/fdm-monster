const { Schema, model } = require("mongoose");

const CameraStreamSchema = new Schema({
  streamURL: {
    type: String,
    unique: true,
    required: true,
  },
  printerId: {
    type: Schema.Types.ObjectId,
    ref: "Printer",
    required: false,
    index: {
      unique: true,
      partialFilterExpression: { printerId: { $type: Schema.Types.ObjectId } },
    },
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
