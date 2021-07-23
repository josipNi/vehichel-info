import baseConfig from "./base.config";
import { IConfiguration } from "./types";

export default {
  ...baseConfig,
  connectionStrings: {
    mongo: "mongodb://localhost:27017/josipn-nodejs-demo-tests",
  },
  server: {
    port: 4003,
  },
  environment: "test",
  jwt: {
    algorithm: "HS256",
    expiresIn: "1d",
    issuer: "mocha-test-runner",
    secretOrPrivateKey:
      "q&KsAa{H8JEk^s/`?O{|xe^QU'!bl.?g`Rt0%+7){l@6ebmn%G7<9gUpgJ1zLp0",
  },
} as IConfiguration;
