import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { RequestWithUser } from "../middleware/types";
import userService from "../services/user.service";

const router = Router();
const path = "/me";
router.get("/", authMiddleware, (req: RequestWithUser, res) => {
  return res.json(req.user);
});
router.post(
  "/update-password",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
      await userService.updatePassword(
        req.user.username,
        oldPassword,
        newPassword
      );
      return res.json(true);
    } catch (error) {
      res.status(500);
      return res.json(error.message);
    }
  }
);
export default {
  path,
  router,
};
