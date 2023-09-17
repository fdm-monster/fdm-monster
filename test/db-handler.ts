import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

let mongoMemory: MongoMemoryServer;

/**
 * Connect to the in-memory database.
 */
export const connect = async () => {
  mongoMemory = await MongoMemoryServer.create();
  const uri = mongoMemory.getUri();

  const mongooseOpts = {};
  await mongoose.connect(uri, mongooseOpts);
};

/**
 * Drop database, close the connection and stop mongoMemory.
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoMemory.stop();
};

/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
