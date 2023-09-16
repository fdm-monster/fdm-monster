import { model, Schema } from "mongoose";

const PermissionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

export const Permission = model("Permission", PermissionSchema);
