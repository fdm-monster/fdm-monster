import { model, Schema } from "mongoose";

export interface IPermission {
  id: string;
  name: string;
}

const PermissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: true,
  },
});

export const Permission = model("Permission", PermissionSchema);
