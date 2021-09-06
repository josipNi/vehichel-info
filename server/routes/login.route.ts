import { Router } from "express";
import userService from "../services/user.service";

const router = Router();
const path = "/login";

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = await userService.login(username, password);
    return res.json({ token: token });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});
export default {
  path,
  router,
};
