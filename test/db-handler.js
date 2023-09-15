const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoMemory;

/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
  mongoMemory = await MongoMemoryServer.create();
  const uri = mongoMemory.getUri();

  const mongooseOpts = {};
  await mongoose.connect(uri, mongooseOpts);
};

/**
 * Drop database, close the connection and stop mongoMemory.
 */
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoMemory.stop();
};

/**
 * Remove all the data for all db collections.
 */
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
