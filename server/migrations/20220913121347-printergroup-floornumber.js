module.exports = {
  async up(db, client) {
    const dbCollection = db.collection("printergroups");
    const dbCollection2 = db.collection("printerfloors");
    // await dbCollection.syncIndexes();
    // await dbCollection2.syncIndexes();

    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
