import { Router } from "express";
import loginRoute from "./login.route";
import signUpRoute from "./sign-up.route";
import carRoute from "./car.route";

export const router = Router();

router.use(loginRoute.path, loginRoute.router);
router.use(signUpRoute.path, signUpRoute.router);
router.use(carRoute.path, carRoute.router);

export default router;
