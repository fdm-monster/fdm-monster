export function mapArray(docs) {
  if (!docs?.length) return [];

  return docs.map(map);
}

/**
 * @param doc
 * @returns {any}
 */
export function map(doc) {
  if (!doc) return;

  const data = doc.toJSON();
  const id = data._id?.toString();
  delete data._id;
  delete data.__v;
  data.id = id;
  return data;
}
