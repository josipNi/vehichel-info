import { Router } from "express";
import userService from "../services/user.service";
const router = Router();
const path = "/most-liked";
router.get("/", async (req, res) => {
  try {
    const result = await userService.getLikedUsers();
    return res.json(result);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});
export default { path, router };
