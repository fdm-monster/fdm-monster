import { model, Schema, Types } from "mongoose";

export interface ICameraStream {
  id: string;
  name?: string;
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
});

export const CameraStream = model("CameraStream", CameraStreamSchema);
