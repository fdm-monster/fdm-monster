import { AnyArray, model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface IUser<KeyType = MongoIdType> {
  id: KeyType;
  username: string;
  isDemoUser: boolean;
  isRootUser: boolean;
  isVerified: boolean;
  needsPasswordChange: boolean;
  passwordHash: string;
  createdAt: Date;
  roles: AnyArray<string>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  isDemoUser: {
    type: Boolean,
    default: false,
  },
  isRootUser: {
    type: Boolean,
    default: false,
  },
  // Requiring password change means that the user will be redirected to the change password page
  // when they log in. The user will not be able to access any other page until they change their password.
  needsPasswordChange: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  roles: {
    type: Array,
    required: true,
  },
});

export const User = model("User", UserSchema);
