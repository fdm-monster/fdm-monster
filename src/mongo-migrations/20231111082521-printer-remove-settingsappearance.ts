module.exports = {
  // @ts-ignore
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $unset: { settingsAppearance: 1 } });
      });
    } catch (e) {
      console.log("Error executing up migration", e);
      throw e;
    } finally {
      await session.endSession();
    }
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  // @ts-ignore
  async down(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the inverse migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $set: { settingsAppearance: {} } });
      });
    } catch (e) {
      console.log("Error executing down migration", e);
      throw e;
    } finally {
      await session.endSession();
    }
  },
};
