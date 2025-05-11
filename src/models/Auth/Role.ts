import { model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface IRole<KeyType = MongoIdType> {
  id: KeyType;
  name: string;
}

const RoleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
  },
});

export const Role = model("Role", RoleSchema);
