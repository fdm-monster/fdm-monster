export async function sleep(ms = 2000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}
