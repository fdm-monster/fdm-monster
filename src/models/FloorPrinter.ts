import { Schema, Types } from "mongoose";
import { IFloor } from "@/models/Floor";
import { MongoIdType } from "@/shared.constants";

export interface IPosition<KeyType = MongoIdType> {
  x: number;
  y: number;
  floorId: KeyType;
  printerId: KeyType;
}

export const PrinterInFloorSchema = new Schema<IPosition<Types.ObjectId>>(
  {
    printerId: {
      type: Schema.Types.ObjectId,
      ref: "Printer",
      required: true,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
      default: function(this: { parent: () => IFloor }) {
        return this.parent().id;
      },
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    }, // No metadata needed yet
  },
  { _id: false },
);
