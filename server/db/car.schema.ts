import { model, Schema, Types } from "mongoose";
import { CarSchemaName } from "./schema-names";
import { CarDocument } from "./types";

export const CarSchema = new Schema(
  {
    make: { type: String, required: true, index: true },
    model: { type: String, index: true },
    year: { type: Number, required: true, index: true },
  },
  { collection: CarSchemaName }
);

CarSchema.index({ make: 1, model: 1, year: 1 }, { unique: true });

// @ts-ignore
const CarModel = model<CarDocument>(CarSchemaName, CarSchema);

export default CarModel;
