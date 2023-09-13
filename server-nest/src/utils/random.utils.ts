export function randomString(strLength = 5) {
  const result = [];
  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // abcdefghijklmnopqrstuvwxyz0123456789

  while (strLength--) {
    result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }

  return result.join("");
}

export function generateCorrelationToken() {
  return Math.random().toString(36).slice(2);
}

export function getRandomInt(max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(Math.random() * max);
}
