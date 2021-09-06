export interface IUser {
  userId: string;
  username: string;
}

export enum Exceptions {
  UserNameTakenException = "UserNameTakenException",
  InternalServerError = "InternalServerError",
  InvalidIdProvidedException = "InvalidIdProvidedException",
  UsernameOrPasswordIsEmptyException = "UsernameOrPasswordIsEmptyException",
  InvalidCredentialsException = "InvalidCredentialsException",
  AuthorizationNotProvided = "AuthorizationNotProvided",
  TokenVerificationFailed = "TokenVerificationFailed",
  UserNotFoundException = "UserNotFoundException",
  InvalidYearSupplied = "InvalidYearSupplied",
  EmptyBodyNotAllowed = "EmptyBodyNotAllowed",
  DataNotFound = "DataNotFound",
}
