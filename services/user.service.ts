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

    const { salt, hashedPassword } = this.passwordService.getSaltAndPassword(
      password
    );
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
      throw new Error(Exceptions.UsernameOrPasswordIsEmptyException);
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
    const { salt, hashedPassword } = this.passwordService.getSaltAndPassword(
      newPassword
    );

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

  like = async (
    loggedInUserId: string | Types.ObjectId,
    userToBeLikedId: string | Types.ObjectId
  ) => {
    if (typeof loggedInUserId != "string") {
      loggedInUserId = loggedInUserId.toHexString();
    }
    if (typeof userToBeLikedId != "string") {
      userToBeLikedId = userToBeLikedId.toHexString();
    }
    const loggedInUser = await this.getUser(
      { _id: loggedInUserId },
      { liked: 1, likedBy: 1 }
    );
    if (
      loggedInUser.liked.find((x) => x.userId.toHexString() === userToBeLikedId)
    ) {
      return;
    }
    const userToBeLiked = await this.getUser({ _id: userToBeLikedId });
    if (!userToBeLiked) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    // ! Might need to add Transaction so that this saves together or does not save at all
    // ! Might need to prevent the case where both users like each other at the same time
    userToBeLiked.likedBy.push({
      userId: Types.ObjectId(loggedInUserId as string),
    });
    loggedInUser.liked.push({
      userId: Types.ObjectId(userToBeLikedId as string),
    });

    await Promise.all([userToBeLiked.save(), loggedInUser.save()]);
  };
  unlike = async (
    loggedInUserId: string | Types.ObjectId,
    userToBeUnLikedId: string | Types.ObjectId
  ) => {
    if (typeof loggedInUserId != "string") {
      loggedInUserId = loggedInUserId.toHexString();
    }
    if (typeof userToBeUnLikedId != "string") {
      userToBeUnLikedId = userToBeUnLikedId.toHexString();
    }
    const loggedInUser = await this.getUser(
      { _id: loggedInUserId },
      { liked: 1, likedBy: 1 }
    );
    const hasLikedUser = loggedInUser.liked.find(
      (x) => x.userId.toHexString() === userToBeUnLikedId
    );
    if (!hasLikedUser) {
      return;
    }
    const userToBeUnLiked = await this.getUser({ _id: userToBeUnLikedId });
    if (!userToBeUnLiked) {
      throw new Error(Exceptions.UserNotFoundException);
    }
    userToBeUnLiked.likedBy = userToBeUnLiked.likedBy.filter(
      (x) => x.userId.toHexString() !== loggedInUserId
    );
    loggedInUser.liked = loggedInUser.liked.filter(
      (x) => x.userId.toHexString() !== userToBeUnLikedId
    );

    await Promise.all([userToBeUnLiked.save(), loggedInUser.save()]);
  };

  getLikedUsers = async () => {
    const result = await this.userModel.aggregate([
      {
        $project: { likedBySize: { $size: "$likedBy" }, username: 1 },
      },
      {
        $sort: { likedBySize: -1 }
      },
    ]);

    return result;
  };
}

export default new UserService();
