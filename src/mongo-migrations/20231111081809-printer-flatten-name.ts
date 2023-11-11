module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $rename: { "settingsAppearance.name": "name" } });
      });
    } finally {
      await session.endSession();
    }
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the inverse migration
        const dbCollection = db.collection("printers");
        await dbCollection.updateMany({}, { $rename: { name: "settingsAppearance.name" } });
      });
    } finally {
      await session.endSession();
    }
  },
};
