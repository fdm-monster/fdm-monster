module.exports = {
  // @ts-ignore
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("users").update({}, { $unset: { name: 1 } }, { multi: true });
      });
    } finally {
      await session.endSession();
    }
  },

  // @ts-ignore
  async down(db, client) {
    await db.collection("printers").update({}, { $set: { name: "default" } }, { multi: true });
  },
};
