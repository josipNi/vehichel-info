import { Document, Types } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  password: string;
  salt: string;
  liked: LeanLikeDocument[];
  likedBy: LeanLikeDocument[];
}

export interface LeanUserDocument extends Omit<UserDocument, keyof Document> {}

export interface LikeDocument extends Document {
  userId: Types.ObjectId;
}

export interface LeanLikeDocument extends Omit<LikeDocument, keyof Document> {}
