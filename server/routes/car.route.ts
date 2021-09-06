import { Router } from "express";
import { LeanCarDocument } from "../db/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { RequestWithUser } from "../middleware/types";
import carService from "../services/car.service";
import { Exceptions } from "../services/types";

const router = Router();
const path = "/car";

router.get(
  "/:make?/:model?/:year?",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const params = req.params;
    const make = params.make || (req.query.make as string);
    const model = params.model || (req.query.model as string);
    const year = +params.year || +req.query.year;

    let query = {
      $and: [],
    };
    if (make) {
      query.$and.push({
        make: {
          $regex: new RegExp(make, "gi"),
        },
      });
    }
    if (year) {
      query.$and.push({
        year,
      });
    }
    if (model) {
      query.$and.push({
        model: { $regex: new RegExp(model, "gi") },
      });
    }

    const cars = await carService.search(query);
    return res.json(cars);
  }
);

router.post("/", authMiddleware, async (req, res) => {
  const model: LeanCarDocument = req.body;
  if (Object.keys(model).length === 0) {
    return res.status(400).send(Exceptions.EmptyBodyNotAllowed);
  }
  if (model.year < 1995 || model.year > 2022) {
    return res.status(400).send(Exceptions.InvalidYearSupplied);
  }
  try {
    const result = await carService.create(model);
    return res.json(result);
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const id = req.params.id || (req.query.id as string);
  try {
    const result = await carService.delete(id);
    return res.json(result);
  } catch (error) {
    return res.status(400).send(Exceptions.InvalidIdProvidedException);
  }
});

export default {
  path,
  router,
};
