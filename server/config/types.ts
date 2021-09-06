import { Algorithm } from "jsonwebtoken";
export interface IConfiguration {
  connectionStrings: {
    mongo: string;
  };
  encryption: {
    secretKey: string;
  };
  server: {
    port: number;
    baseRoute: string;
  };
  jwt: {
    issuer: string;
    expiresIn: string | number; //  Accepted strings are listed here https://github.com/vercel/ms
    algorithm: Algorithm;
    secretOrPrivateKey: string;
  };
  environment: EnvironmentType;
  isEnvironment(type: EnvironmentType): boolean;
}

export type EnvironmentType = "development" | "production" | "test";

export type EnvironmentConfiguration = {
  [key in EnvironmentType]: IConfiguration;
};
