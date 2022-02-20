import mongoose from "mongoose";
const AlertSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        required: true
    },
    printer: {
        type: Array,
        required: true
    },
    trigger: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    scriptLocation: {
        type: String,
        required: true
    }
});
const Alert = mongoose.model("Alerts", AlertSchema);
export default Alert;
