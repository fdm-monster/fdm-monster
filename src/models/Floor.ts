import { model, Schema, Types } from "mongoose";
import { IPrinterInFloor, PrinterInFloorSchema } from "./FloorPrinter";

export interface IFloor {
  _id: Types.ObjectId;
  id: string;
  name: string;
  floor: number;
  printers: IPrinterInFloor[];
}

const FloorSchema = new Schema<IFloor>({
  name: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    unique: true,
    min: [0, "Floors must be numbered from 0 and up"],
    required: true,
  },
  printers: [PrinterInFloorSchema],
});

export const Floor = model("Floor", FloorSchema);
