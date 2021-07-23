import { Router } from "express";
import { Exceptions } from "../services/types";
import loginRoute from "./login.route";
import meRoute from "./me.route";
import mostLikedRoute from "./most-liked.route";
import signUpRoute from "./sign-up.route";
import userRoute from "./user.route";

const router = Router();

router.use(loginRoute.path, loginRoute.router);
router.use(signUpRoute.path, signUpRoute.router);
router.use(meRoute.path, meRoute.router);
router.use(userRoute.path, userRoute.router);
router.use(mostLikedRoute.path, mostLikedRoute.router);

router.use(function (req, res, next) {
  if (!req.route) {
    return res.status(404).json(Exceptions.RouteNotFound);
  }
  next();
});

router.use(function (err, req, res, next) {
  if (err) {
    return res.status(500).json(Exceptions.InternalServerError);
  }
});

export default router;
