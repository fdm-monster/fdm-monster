import mongoose from "mongoose";
const CustomGCodeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    gcode: {
        type: Array,
        required: true
    }
});
const CustomGCode = mongoose.model("CustomGCode", CustomGCodeSchema);
export default CustomGCode;
