module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("printerfloors").update({}, { $unset: { printerGroups: 1 } }, { multi: true });
        await db.collection("printerfloors").update({}, { $set: { printers: [] } }, { multi: true });
        await db.collection("printerfloors").rename("floors");
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await db.collection("printerfloors").update({}, { $set: { printerGroups: [] } }, { multi: true });
      await db.collection("printerfloors").update({}, { $unset: { printers: 1 } }, { multi: true });
      await db.collection("floors").rename("printerfloors");
    } finally {
      await session.endSession();
    }
  },
};
