import { model, Schema } from "mongoose";

export interface IRole {
  id: string;
  name: string;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
  },
});

export const Role = model("Role", RoleSchema);
