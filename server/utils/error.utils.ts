export function errorSummary(e) {
  return e.message ? `${e.message}\n ${e.stack}` : `'${e}'`;
}
