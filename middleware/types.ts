import { Request } from "express";
import { IUser } from "../services/types";

export type RequestWithUser = Request & { user: IUser };
