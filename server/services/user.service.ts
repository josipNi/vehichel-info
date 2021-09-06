import UserModel from "../db/user.schema";
import PasswordService from "./password.service";
import { sign, SignOptions } from "jsonwebtoken";
import getEnvironmentConfig from "../config";
import { Exceptions } from "./types";
import { FilterQuery, Types } from "mongoose";
import { UserDocument } from "../db/types";

class UserService {
  private readonly userModel: typeof UserModel;
  private readonly jwtOptions: SignOptions;
  private readonly jwtPrivateKey: string;
  private readonly passwordService: typeof PasswordService;
  constructor() {
    const { jwt } = getEnvironmentConfig();
    this.userModel = UserModel;
    this.jwtOptions = {
      algorithm: jwt.algorithm,
      expiresIn: jwt.expiresIn,
      issuer: jwt.issuer,
    };
    this.jwtPrivateKey = jwt.secretOrPrivateKey;
    this.passwordService = PasswordService;
  }

  getUser = async (query: FilterQuery<UserDocument>, projection?: any) => {
    const existingUser = await this.userModel.findOne(query, projection);
    return existingUser;
  };

  signUp = async (username: string, password: string) => {
    if (!username || !password) {
      throw new Error(Exceptions.UsernameOrPasswordIsEmptyException);
    }

    const existingUser = await this.getUser({ username });
    if (existingUser) {
      throw new Error(Exceptions.UserNameTakenException);
    }

    const { salt, hashedPassword } =
      this.passwordService.getSaltAndPassword(password);
    const newUser = new this.userModel({
      username,
      password: hashedPassword,
      salt,
    });
    await newUser.save();
    return await this.login(username, password);
  };

  login = async (username: string, password: string) => {
    const existingUser = await this.getUser({ username });
    if (!existingUser) {
      throw new Error(Exceptions.UserNotFoundException);
    }

    const isValidPassword = PasswordService.isValid(password, existingUser);
    if (!isValidPassword) {
      throw new Error(Exceptions.UserNotFoundException);
    }

    const payload = {
      userId: existingUser._id,
      username: existingUser.username,
    };

    const token = sign(payload, this.jwtPrivateKey, this.jwtOptions);
    return token;
  };

  updatePassword = async (
    username: string,
    oldPassword: string,
    newPassword: string
  ) => {
    const existingUser = await this.getUser({ username });
    if (!existingUser) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    const isValidPassword = PasswordService.isValid(oldPassword, existingUser);
    if (!isValidPassword) {
      throw new Error(Exceptions.InvalidCredentialsException);
    }
    const { salt, hashedPassword } =
      this.passwordService.getSaltAndPassword(newPassword);

    const user = await this.userModel.findOneAndUpdate(
      { username },
      {
        salt,
        password: hashedPassword,
      },
      { new: true }
    );
    return user;
  };
}

export default new UserService();
