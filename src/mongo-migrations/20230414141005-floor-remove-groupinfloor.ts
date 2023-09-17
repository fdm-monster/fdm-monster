module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const collections = await client.db().listCollections().toArray();
        if (collections.find((c) => c.name === "printerfloors")) {
          await db.collection("printerfloors").update({}, { $unset: { printerGroups: 1 } }, { multi: true });
          await db.collection("printerfloors").update({}, { $set: { printers: [] } }, { multi: true });
          await db.collection("printerfloors").rename("floors");
        }
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      const collections = await client.db().listCollections().toArray();
      if (collections.find((c) => c.name === "floors")) {
        await db.collection("printerfloors").update({}, { $set: { printerGroups: [] } }, { multi: true });
        await db.collection("printerfloors").update({}, { $unset: { printers: 1 } }, { multi: true });
        await db.collection("floors").rename("printerfloors");
      }

      if (!collections.find((c) => c.name === "printerfloors")) {
        throw new Error("Illegal migration state, didnt find floors table");
      }
    } finally {
      await session.endSession();
    }
  },
};
