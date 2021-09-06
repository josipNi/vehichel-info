import baseConfig from "./base.config";
import { IConfiguration } from "./types";

export default {
  ...baseConfig,
  environment: "production",
} as IConfiguration;
