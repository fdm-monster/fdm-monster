import { model, Schema } from "mongoose";

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
