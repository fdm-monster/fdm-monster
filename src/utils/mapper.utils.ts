export function mapMongoDbArray(docs) {
  if (!docs?.length) return [];

  return docs.map(mapMongoDb);
}

/**
 * @param doc
 * @returns {any}
 */
export function mapMongoDb(doc: any) {
  if (!doc) return;

  const data = doc.toJSON();
  const id = data._id?.toString();
  delete data._id;
  delete data.__v;
  data.id = id;
  return data;
}
