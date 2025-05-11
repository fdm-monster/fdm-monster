export function isParsableDate(value: string): boolean {
  const timestamp = Date.parse(value);
  return !isNaN(timestamp);
}
