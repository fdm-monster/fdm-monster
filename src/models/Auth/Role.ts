import { model, Schema } from "mongoose";

const RoleSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

export const Role = model("Role", RoleSchema);
