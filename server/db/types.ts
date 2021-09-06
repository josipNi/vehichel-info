import { Document, Types } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  password: string;
  salt: string;
}

export interface LeanUserDocument extends Omit<UserDocument, keyof Document> {}

// @ts-ignore
export interface CarDocument extends Document {
  _id: string | Types.ObjectId;
  make: string;
  model: string;
  year: number;
}

export interface LeanCarDocument extends Omit<CarDocument, keyof Document> {
  _id: string;
  model: string;
}
