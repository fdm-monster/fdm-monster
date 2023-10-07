import { AnyArray, model, Schema } from "mongoose";

export interface ICustomGcode {
  id: string;
  name: string;
  description: string;
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
