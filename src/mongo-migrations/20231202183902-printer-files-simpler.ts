module.exports = {
  // @ts-ignore
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $set: { fileList: [] } });
      });
    } catch (e) {
      console.log("Error executing up migration", e);
      throw e;
    } finally {
      await session.endSession();
    }
  },

  // @ts-ignore
  async down(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Clear the data
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $set: { fileList: {} } });
      });
    } catch (e) {
      console.log("Error executing down migration", e);
      throw e;
    } finally {
      await session.endSession();
    }
  }
};
