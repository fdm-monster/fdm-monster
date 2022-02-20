import mongoose from "mongoose";


const PrinterInGroupSchema = new mongoose.Schema({
    printerId: mongoose.Schema.Types.ObjectId,
    location: {
        // Top|Bottom Left|Right, or whatever the UI needs
        type: String
    }
}, {_id: false});
const PrinterGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: Object,
        required: true,
        default: {x: 0, y: 0},
        x: {
            type: Number,
            required: false
        },
        y: {
            type: Number,
            required: false
        }
    },
    printers: {
        type: [PrinterInGroupSchema],
        required: true
    }
});
const PrinterGroup = mongoose.model("PrinterGroup", PrinterGroupSchema);
export default PrinterGroup;
