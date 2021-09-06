import baseConfig from "./base.config";
import { IConfiguration } from "./types";

export default {
  ...baseConfig,
  environment: "development",
  server: {
    port: 4001,
  },
  connectionStrings: {
    mongo: "mongodb://localhost:27017/nodeJsTestApp",
  },
  jwt: {
    algorithm: "HS256",
    expiresIn: "1d",
    issuer: "localhost",
    secretOrPrivateKey:
      "q&KsAa{H8JEk^s/`?O{|xe^QU'!bl.?g`Rt0%+7){l@6ebmn%G7<9gUpgJ1zLp0",
  },
} as IConfiguration;
