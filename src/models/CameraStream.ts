import { model, Schema, Types } from "mongoose";

export interface ICameraStream {
  id: string;
  streamURL: string;
  printerId?: Types.ObjectId;
  settings: {
    aspectRatio: string;
    rotationClockwise: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  };
}

const CameraStreamSchema = new Schema<ICameraStream>({
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

export const CameraStream = model("CameraStream", CameraStreamSchema);
