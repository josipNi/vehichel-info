import { FilterQuery, Types } from "mongoose";
import { CarDocument, LeanCarDocument } from "../db/types";
import CarModel from "../db/car.schema";

class CarService {
  search = async (query: FilterQuery<CarDocument>) => {
    if (query.$and && query.$and.length === 0) {
      return await CarModel.find().sort({ _id: -1 }).limit(100);
    }
    return await CarModel.find(query).limit(100);
  };

  create = async (data: LeanCarDocument) => {
    const car = new CarModel(data);
    await car.save();
    return car;
  };

  delete = async (id: string | Types.ObjectId) => {
    return await CarModel.deleteOne({ _id: id });
  };
}

export default new CarService();
