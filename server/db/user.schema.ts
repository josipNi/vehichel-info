import { Schema, model } from "mongoose";
import { UserSchemaName } from "./schema-names";
import { UserDocument } from "./types";
export const UserSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    salt: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel = model<UserDocument>(UserSchemaName, UserSchema);
export default UserModel;
