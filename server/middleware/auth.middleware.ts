import { verify } from "jsonwebtoken";
import getEnvironmentConfig from "../config";
import { RequestWithUser } from "./types";
import { Response } from "express";
import { Exceptions, IUser } from "../services/types";

const { jwt } = getEnvironmentConfig();
export function authMiddleware(req: RequestWithUser, res: Response, next) {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      return res.status(403).send(Exceptions.AuthorizationNotProvided);
    }
    const verifiedJwt = verify(authorization, jwt.secretOrPrivateKey) as IUser;
    req.user = verifiedJwt;
    next();
  } catch (error) {
    return res.status(403).send(Exceptions.TokenVerificationFailed);
  }
}
