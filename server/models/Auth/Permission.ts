import mongoose from "mongoose";
const PermissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});
const Permission = mongoose.model("Permission", PermissionSchema);
export default Permission;
