import mongoose from "mongoose";
import mongodbMemoryServer from "mongodb-memory-server";
const { MongoMemoryServer } = mongodbMemoryServer;
let mongoMemory;
export const connect = async () => {
    mongoMemory = await MongoMemoryServer.create();
    const uri = mongoMemory.getUri();
    const mongooseOpts = {};
    await mongoose.connect(uri, mongooseOpts);
};
export const closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoMemory.stop();
};
export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};
