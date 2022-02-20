const { getDefaultClientSettings } = require("../constants/client-settings.constants");

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("clientsettings");
        await dbCollection.deleteMany();
        await dbCollection.insertOne(getDefaultClientSettings());
      });
    } catch (e) {
      console.error("Migration experienced error", e);
      throw e;
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
  }
};
