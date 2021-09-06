import { readFileSync } from "fs";
import CarModel from "./car.schema";
import { LeanCarDocument } from "./types";

type CarWithOid = LeanCarDocument & { _id: { $oid: string } };
class JsonImporter {
  importIfEmpty = async () => {
    try {
      if (await CarModel.findOne({})) {
        throw new Error("Not handled.");
      }
      const cars: CarWithOid[] = JSON.parse(
        readFileSync("./VehicleInfo.json", "utf-8")
      );

      const mappedCars = cars.map((x) => {
        return {
          ...x,
          _id: x._id.$oid,
        };
      });

      await CarModel.insertMany(mappedCars);
    } catch (err) {
      console.error("Database has data... Not handling this for now....");
      console.error(err);
    }
  };
}

export default new JsonImporter();
