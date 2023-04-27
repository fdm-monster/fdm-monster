module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("printers").update({}, { $unset: { sortIndex: 1 } }, { multi: true });
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    await db.collection("printers").update({}, { $set: { sortIndex: 0 } }, { multi: true });
  },
};
