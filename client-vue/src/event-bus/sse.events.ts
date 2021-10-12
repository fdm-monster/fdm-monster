export const sseMessageGlobal = "sse-message-global";
export const sseGroups = "sse-groups";
export const sseTestPrinterUpdate = (correlationToken: string) =>
  `sse-message-test-printer-${correlationToken}`;
