import { model, Schema } from "mongoose";
import { MongoIdType } from "@/shared.constants";

export interface IRefreshToken<KeyType = MongoIdType> {
  id: KeyType;
  userId: KeyType;
  createdAt: Date;
  expiresAt: number;
  refreshToken: string;
  refreshAttemptsUsed: number;
}

const RefreshTokenSchema = new Schema<IRefreshToken<Schema.Types.ObjectId>>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: false,
  },
  createdAt: {
    required: true,
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    required: true,
    type: Number,
  },
  refreshToken: {
    type: String,
    unique: true,
    trim: true,
    required: true,
  },
  refreshAttemptsUsed: {
    type: Number,
    required: true,
  },
});

export const RefreshToken = model("RefreshToken", RefreshTokenSchema);
