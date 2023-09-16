export function byteCount(s: any) {
  return encodeURI(s).split(/%..|./).length - 1;
}

export function sizeKB(object: any) {
  const serializedObject = JSON.stringify(object);
  const bytesCount = byteCount(serializedObject);
  return bytesCount / 1024;
}

export function formatKB(object: any) {
  const size = sizeKB(object);
  return `${size.toFixed(2)} KB`;
}
