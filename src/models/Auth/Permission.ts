import { model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface IPermission<KeyType = MongoIdType> {
  id: KeyType;
  name: string;
}

const PermissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: true,
  },
});

export const Permission = model("Permission", PermissionSchema);
