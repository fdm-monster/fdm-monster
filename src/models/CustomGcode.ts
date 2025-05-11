import { AnyArray, model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface ICustomGcode<KeyType = MongoIdType> {
  id: KeyType;
  name: string;
  description?: string;
  gcode: AnyArray<string>;
}

const CustomGCodeSchema = new Schema<ICustomGcode>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  gcode: {
    type: Array,
    required: true,
  },
});

export const CustomGcode = model("CustomGCode", CustomGCodeSchema);
