export function PP(input: any) {
  return JSON.stringify(input, null, 2);
}

export function PL(input: any) {
  console.log(PP(input));
}
