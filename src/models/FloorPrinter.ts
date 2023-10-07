import { Schema, Types } from "mongoose";

export interface IPrinterInFloor {
  x: number;
  y: number;
  printerId: Types.ObjectId;
}

export const PrinterInFloorSchema = new Schema<IPrinterInFloor>({
  printerId: {
    type: Schema.Types.ObjectId,
    ref: "Printer",
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  }, // No metadata needed yet
  _id: false,
});
