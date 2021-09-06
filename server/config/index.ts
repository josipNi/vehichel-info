import development from "./development.config";
import production from "./production.config";
import test from "./tests.config";
import { IConfiguration } from "./types";

const allConfigs = {
  development,
  production,
  test,
};
export default function getEnvironmentConfig(): IConfiguration {
  const env = process.env.NODE_ENV?.trim().toLowerCase() || "development";
  return allConfigs[env];
}
