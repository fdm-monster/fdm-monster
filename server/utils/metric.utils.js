function byteCount(s) {
  return encodeURI(s).split(/%..|./).length - 1;
}

function sizeKB(object) {
  const serializedObject = JSON.stringify(object);
  const bytesCount = byteCount(serializedObject);
  return bytesCount / 1024;
}

function formatKB(object) {
  const size = sizeKB(object);
  return `${size.toFixed(2)} KB`;
}

module.exports = {
  byteCount,
  sizeKB,
  formatKB,
};
