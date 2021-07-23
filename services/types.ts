export interface IUser {
  userId: string;
  username: string;
}

export enum Exceptions {
  UserNameTakenException = "UserNameTakenException",
  InternalServerError = "InternalServerError",
  RouteNotFound = "RouteNotFound",
  UsernameOrPasswordIsEmptyException = "UsernameOrPasswordIsEmptyException",
  InvalidCredentialsException = "InvalidCredentialsException",
  AuthorizationNotProvided = "AuthorizationNotProvided",
  TokenVerificationFailed = "TokenVerificationFailed",
  UserNotFoundException = "UserNotFoundException",
}
