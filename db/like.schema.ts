import { model, Schema } from "mongoose";
import { LikeSchemaName } from "./schema-names";
import { LikeDocument } from "./types";

export const LikeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { collection: LikeSchemaName }
);

const LikeModel = model<LikeDocument>(LikeSchemaName, LikeSchema);

export default LikeModel;
