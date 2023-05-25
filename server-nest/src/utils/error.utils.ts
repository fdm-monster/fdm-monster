export function errorSummary(e: any) {
  return e.message ? `${e.message}\n ${e.stack}` : `'${e}'`;
}
