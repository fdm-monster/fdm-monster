import { model, Schema } from "mongoose";
import { IPosition, PrinterInFloorSchema } from "./FloorPrinter";
import { MongoIdType } from "@/shared.constants";

export interface IFloor<KeyType = MongoIdType> {
  id: string;
  name: string;
  floor: number;
  printers: IPosition<KeyType>[];
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
