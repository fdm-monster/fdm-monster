module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("users");
        await dbCollection.updateMany({}, { $rename: { password: "passwordHash" } });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      // Safety first
      await session.withTransaction(async () => {
        // Do the migration
        const dbCollection = db.collection("users");
        await dbCollection.updateMany({}, { $rename: { passwordHash: "password" } });
      });
    } finally {
      await session.endSession();
    }
  },
};
