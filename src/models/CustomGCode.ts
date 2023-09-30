import { model, Schema } from "mongoose";

export interface ICustomGCode {
  id: string;
  name: string;
  description: string;
  gcode: string[];
}

const CustomGCodeSchema = new Schema({
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

export const CustomGCode = model("CustomGCode", CustomGCodeSchema);
