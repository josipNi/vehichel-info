import { connect, connection, ConnectionStates, disconnect } from "mongoose";
import getEnvironmentConfig from "../config";

const config = getEnvironmentConfig();
let mongoDb;

connection.on("connected", () => {
  console.log("Connection established with MongoDB");
});

let isReconnectTimerSet = false;
let isManualDisconnect = false;
const handleReconnect = () => {
  if (!isReconnectTimerSet && !isManualDisconnect) {
    isReconnectTimerSet = true;
    setTimeout(async () => {
      isReconnectTimerSet = false;
      mongoDb = await mongoConnect();
    }, 5000);
  }
};

connection.on("disconnected", () => {
  console.warn("MongoDB event disconnected");
  handleReconnect();
});

connection.on("reconnected", () => {
  console.log("Reconnected to MongoDB");
});

connection.on("error", (error) => {
  console.error(`MongoDB event connection error`);
  if (error) {
    console.error(
      "Failed to connect to mongo on startup - retrying in 5s: ",
      error
    );
    handleReconnect();
  }
});

export function isMongoConnected(): boolean {
  if (!connection) {
    return false;
  }
  const connected: ConnectionStates = 1;
  return connection?.readyState === connected;
}

async function mongoConnect() {
  return connect(config.connectionStrings.mongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
}

export async function initMongoDb() {
  mongoDb = await mongoConnect();
  return mongoDb;
}

export const awaitableDisconnect = () => {
  isManualDisconnect = true;
  return connection.close();
};
