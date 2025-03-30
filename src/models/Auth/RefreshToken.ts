import { model, Schema, Types } from "mongoose";

export interface IRefreshToken<KeyType = string> {
  id: KeyType;
  userId: Types.ObjectId;
  createdAt: Date;
  expiresAt: number;
  refreshToken: string;
  refreshAttemptsUsed: number;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
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
