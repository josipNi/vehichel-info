import { Router } from "express";
import { Types } from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware";
import { RequestWithUser } from "../middleware/types";
import { Exceptions } from "../services/types";
import userService from "../services/user.service";

const router = Router();
const path = "/user";

router.get("/:id", async (req: RequestWithUser, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    const result = await userService.getUser(
      { _id: id },
      { _id: 1, liked: 1, likedBy: 1 }
    );
    if (!result) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    return res.json({
      id: result._id,
      liked: result.liked.length,
      likedBy: result.likedBy.length,
    });
  } catch (error) {
    if (error.message === Exceptions.UserNotFoundException) {
      return res.status(404).json(Exceptions.UserNotFoundException);
    }
    return res.status(500).json(error.message);
  }
});

router.post("/:id/like", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    await userService.like(req.user.userId, id);
    return res.json(true);
  } catch (error) {
    if (error.message === Exceptions.UserNotFoundException) {
      return res.status(404).json(Exceptions.UserNotFoundException);
    }
    return res.status(500).json(error.message);
  }
});

router.post(
  "/:id/unlike",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const id = req.params.id;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(Exceptions.UserNotFoundException);
      }
      await userService.unlike(req.user.userId, id);
      return res.json(true);
    } catch (error) {
      if (error.message === Exceptions.UserNotFoundException) {
        return res.status(404).json(Exceptions.UserNotFoundException);
      }
      return res.status(500).json(error.message);
    }
  }
);

export default {
  path,
  router,
};
