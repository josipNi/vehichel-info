import { EnvironmentType, IConfiguration } from "./types";

export default {
  connectionStrings: {
    get mongo() {
      const value = process?.env?.MongoConnectionString;
      if (!value) {
        throw `You forgot to define the environment variable MongoConnectionString`;
      }
      return value;
    },
  },
  server: {
    get port() {
      const value = process?.env?.ServerPort;
      if (!value) {
        throw `You forgot to define the environment variable ServerPort`;
      }
      if (isNaN(+value)) {
        throw `The defined environment variable ServerPort must be a number`;
      }
      return +value;
    },
    baseRoute: "/",
  },
  jwt: {
    issuer: process?.env?.JwtIssuer,
    algorithm: process?.env?.JwtAlgorithm,
    expiresIn: process?.env?.JwtExpiresIn,
    secretOrPrivateKey: process?.env?.JwtSecretKey,
  },
  isEnvironment: function (this: IConfiguration, type: EnvironmentType) {
    return this.environment === type;
  },
} as IConfiguration;
