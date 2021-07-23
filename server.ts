import * as express from "express";
import { Server } from "node:http";
import { join } from "path";
import getEnvironmentConfig from "./config";
import {
  awaitableDisconnect,
  initMongoDb,
  isMongoConnected,
} from "./db/mongo.db";
import router from "./routes";
import { json } from "body-parser";

const serverConfig = getEnvironmentConfig().server;

const expressServer = express();

let server: Server;
export async function startAsync() {
  await initMongoDb();

  expressServer.use(json());
  expressServer.use(router);

  server = await new Promise<Server>((resolve) => {
    // make sure the promise resolves before returning
    // making sure that the server is initialized
    const server = expressServer.listen(serverConfig.port, () => {
      console.log(`started server on port ${serverConfig.port}`);
      resolve(server);
    });
  });
  return { server, expressServer };
}

export async function closeAsync() {
  if (isMongoConnected()) {
    await awaitableDisconnect();
  }
  const isResolved = await new Promise<boolean>((resolve) => {
    if (!server) {
      return true;
    }
    server.close(() => {
      resolve(true);
    });
  });
  return isResolved;
}
