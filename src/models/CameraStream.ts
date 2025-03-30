import { model, Schema, Types } from "mongoose";

export interface ICameraStream {
  id: string;
  name?: string;
  streamURL: string;
  printerId?: Types.ObjectId;
  aspectRatio: string;
  rotationClockwise: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

const CameraStreamSchema = new Schema<ICameraStream>({
  streamURL: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  printerId: {
    type: Schema.Types.ObjectId,
    ref: "Printer",
    required: false,
  },
  aspectRatio: {
    required: true,
    type: String,
    default: "16:9",
  },
  rotationClockwise: {
    required: true,
    type: Number,
    default: 0,
  },
  flipVertical: {
    required: true,
    type: Boolean,
    default: false,
  },
  flipHorizontal: {
    required: true,
    type: Boolean,
    default: false,
  },
});

export const CameraStream = model("CameraStream", CameraStreamSchema);
